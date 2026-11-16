import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { z } from 'zod';

const app = new Hono();
const pages = ['index.html', 'chapter-1.html', 'chapter-1-cases.html', 'chapter-1-profit.html', 'chapter-2.html', 'chapter-3.html', 'chapter-4.html', 'chapter-5.html', 'chapter-5-source.html', 'chapter-6.html', 'chapter-7.html'];
const tokenSchema = z.string().regex(/^[a-f0-9]{64}$/);
const selector = z.string().min(1).max(600).regex(/^(?:main|#[A-Za-z][A-Za-z0-9_-]*|\[data-review-key="[a-f0-9]+"\]|\.catalog-card\[data-tool-id="[a-z0-9-]+"\]|[a-z]+\[(?:data-pixel-scene|data-case|data-step|data-method|data-rate|data-compare|data-case-panel|aria-labelledby)="[A-Za-z0-9_ .-]+"\])$/);
const targetSchema = z.object({
  kind: z.enum(['text', 'component', 'page']),
  selector,
  label: z.string().max(300),
  quote: z.string().max(4000),
  prefix: z.string().max(100),
  suffix: z.string().max(100),
  version: z.string().max(100),
  context: z.object({
    fields: z.array(z.object({ id: z.string().max(150), value: z.string().max(500), checked: z.boolean() })).max(100),
    buttons: z.array(selector).max(30),
    details: z.array(selector).max(30),
    hash: z.string().max(200),
  }),
}).strict();
const createSchema = z.object({
  id: z.uuid(), parentId: z.uuid().nullable(), page: z.enum(pages), locale: z.enum(['cn', 'en']),
  author: z.string().trim().min(1).max(60), body: z.string().trim().min(1).max(4000), target: targetSchema,
}).strict();
const editSchema = z.object({
  revision: z.number().int().positive(),
  author: z.string().trim().min(1).max(60).optional(),
  body: z.string().trim().min(1).max(4000).optional(),
  state: z.enum(['open', 'resolved']).optional(),
}).strict();
const digest = async (value) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))), b => b.toString(16).padStart(2, '0')).join('');
const error = (c, status, code) => c.json({ error: code }, status);

app.use('*', async (c, next) => {
  const origin = c.req.header('Origin');
  const allowed = c.env.ALLOWED_ORIGINS.split(',');
  if (origin && !allowed.includes(origin)) return error(c, 403, 'origin_not_allowed');
  if (origin) c.header('Access-Control-Allow-Origin', origin);
  c.header('Vary', 'Origin');
  c.header('Cache-Control', 'no-store');
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, X-Author-Token, X-Admin-Token');
  if (c.req.method === 'OPTIONS') return c.body(null, 204);
  const authorToken = c.req.header('X-Author-Token');
  const adminToken = c.req.header('X-Admin-Token');
  if (authorToken && !tokenSchema.safeParse(authorToken).success) return error(c, 401, 'invalid_author_token');
  if (adminToken && !tokenSchema.safeParse(adminToken).success) return error(c, 401, 'invalid_admin_token');
  const admin = Boolean(adminToken && c.env.ADMIN_TOKEN_HASH && await digest(adminToken) === c.env.ADMIN_TOKEN_HASH);
  if (adminToken && !admin) return error(c, 401, 'invalid_admin_token');
  c.set('admin', admin);
  c.set('owner', authorToken ? await digest(authorToken) : '');
  await next();
});
app.use('*', bodyLimit({ maxSize: 48000, onError: c => error(c, 413, 'body_too_large') }));
app.get('/health', c => c.json({ ok: true }));
app.get('/session', c => c.json({ admin: c.get('admin') }));

function publicComment(row, c) {
  return {
    id: row.id, parentId: row.parent_id, page: row.page, locale: row.locale,
    author: row.author, body: row.body, target: JSON.parse(row.target), state: row.state,
    deleted: Boolean(row.deleted), revision: row.revision, createdAt: row.created_at, updatedAt: row.updated_at,
    canEdit: !row.deleted && (c.get('admin') || row.owner_hash === c.get('owner')),
  };
}

app.get('/comments', async c => {
  const query = z.object({ page: z.enum(pages).optional(), locale: z.enum(['cn', 'en']).optional(),
    state: z.enum(['open', 'resolved']).optional(), before: z.string().max(100).optional() }).safeParse(c.req.query());
  if (!query.success) return error(c, 400, 'invalid_query');
  const clauses = ['parent_id IS NULL', '(deleted = 0 OR EXISTS (SELECT 1 FROM comments child WHERE child.parent_id = comments.id AND child.deleted = 0))'];
  const values = [];
  for (const key of ['page', 'locale', 'state']) {
    if (query.data[key]) { clauses.push(`${key} = ?`); values.push(query.data[key]); }
  }
  if (query.data.before) { clauses.push("created_at || id < ?"); values.push(query.data.before); }
  const { results } = await c.env.DB.prepare(`SELECT * FROM comments WHERE ${clauses.join(' AND ')} ORDER BY created_at DESC, id DESC LIMIT 31`).bind(...values).all();
  const roots = results.slice(0, 30);
  let replies = [];
  if (roots.length) {
    const response = await c.env.DB.prepare(`SELECT * FROM comments WHERE parent_id IN (${roots.map(() => '?').join(',')}) AND deleted = 0 ORDER BY created_at, id`).bind(...roots.map(row => row.id)).all();
    replies = response.results;
  }
  return c.json({ comments: [...roots, ...replies].map(row => publicComment(row, c)),
    next: results.length > 30 ? roots.at(-1).created_at + roots.at(-1).id : null, admin: c.get('admin') });
});
app.get('/comments/:id', async c => {
  const row = await c.env.DB.prepare('SELECT * FROM comments WHERE id = ?').bind(c.req.param('id')).first();
  if (!row) return error(c, 404, 'not_found');
  const root = row.parent_id ? await c.env.DB.prepare('SELECT * FROM comments WHERE id = ?').bind(row.parent_id).first() : row;
  const { results } = await c.env.DB.prepare('SELECT * FROM comments WHERE parent_id = ? AND deleted = 0 ORDER BY created_at, id').bind(root.id).all();
  if (root.deleted && !results.length) return error(c, 404, 'not_found');
  return c.json({ comments: [root, ...results].map(item => publicComment(item, c)), admin: c.get('admin') });
});

app.use('/comments/:id', async (c, next) => {
  if (!['PATCH', 'DELETE'].includes(c.req.method)) return next();
  if (!c.get('owner') && !c.get('admin')) return error(c, 401, 'author_required');
  const row = await c.env.DB.prepare('SELECT * FROM comments WHERE id = ?').bind(c.req.param('id')).first();
  if (!row) return error(c, 404, 'not_found');
  if (!c.get('admin') && row.owner_hash !== c.get('owner')) return error(c, 403, 'not_owner');
  c.set('comment', row);
  await next();
});

async function limitWrites(c) {
  const minute = Math.floor(Date.now() / 60000);
  const identity = c.req.header('CF-Connecting-IP') || c.get('owner');
  const key = await digest(identity) + ':' + minute;
  const row = await c.env.DB.prepare('INSERT INTO rate_windows (key, count, expires) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count = count + 1 WHERE count < 30 RETURNING count').bind(key, minute + 2).first();
  await c.env.DB.prepare('DELETE FROM rate_windows WHERE expires < ?').bind(minute).run();
  return Boolean(row);
}

app.post('/comments', async c => {
  if (!c.get('owner')) return error(c, 401, 'author_required');
  const parsed = createSchema.safeParse(await c.req.json());
  if (!parsed.success) return error(c, 400, 'invalid_comment');
  const data = parsed.data;
  if (!await limitWrites(c)) return error(c, 429, 'too_many_requests');
  let parent = null;
  if (data.parentId) {
    parent = await c.env.DB.prepare('SELECT * FROM comments WHERE id = ? AND parent_id IS NULL').bind(data.parentId).first();
    if (!parent) return error(c, 404, 'not_found');
    const count = await c.env.DB.prepare('SELECT COUNT(*) AS n FROM comments WHERE parent_id = ? AND deleted = 0').bind(parent.id).first();
    if (count.n >= 100) return error(c, 409, 'reply_limit');
  }
  const now = new Date().toISOString();
  await c.env.DB.prepare('INSERT INTO comments (id, parent_id, page, locale, author, owner_hash, body, target, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING')
    .bind(data.id, data.parentId, parent ? parent.page : data.page, parent ? parent.locale : data.locale, data.author, c.get('owner'), data.body, parent ? parent.target : JSON.stringify(data.target), now, now).run();
  const row = await c.env.DB.prepare('SELECT * FROM comments WHERE id = ?').bind(data.id).first();
  if (row.owner_hash !== c.get('owner')) return error(c, 409, 'id_conflict');
  return c.json({ comment: publicComment(row, c) }, 201);
});
app.patch('/comments/:id', async c => {
  const parsed = editSchema.safeParse(await c.req.json());
  if (!parsed.success) return error(c, 400, 'invalid_comment');
  const row = c.get('comment');
  if (row.deleted) return error(c, 409, 'deleted_comment');
  const data = parsed.data;
  if (data.state && row.parent_id) return error(c, 400, 'root_required');
  const result = await c.env.DB.prepare('UPDATE comments SET author = ?, body = ?, state = ?, revision = revision + 1, updated_at = ? WHERE id = ? AND revision = ? AND deleted = 0 RETURNING *')
    .bind(data.author ?? row.author, data.body ?? row.body, data.state ?? row.state, new Date().toISOString(), row.id, data.revision).first();
  if (!result) return error(c, 409, 'revision_conflict');
  return c.json({ comment: publicComment(result, c) });
});
app.delete('/comments/:id', async c => {
  const parsed = z.object({ revision: z.number().int().positive() }).strict().safeParse(await c.req.json());
  if (!parsed.success) return error(c, 400, 'invalid_comment');
  const row = c.get('comment');
  const result = await c.env.DB.prepare("UPDATE comments SET author = '', body = '', deleted = 1, revision = revision + 1, updated_at = ? WHERE id = ? AND revision = ? RETURNING id")
    .bind(new Date().toISOString(), row.id, parsed.data.revision).first();
  if (!result) return error(c, 409, 'revision_conflict');
  return c.json({ deleted: true });
});

export default app;

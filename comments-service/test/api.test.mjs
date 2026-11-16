import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { runtime } from './runtime.mjs';

test('评论的公开读取、作者权限、管理员权限、并发控制与删除', async () => {
  const { mf, db, admin } = await runtime();
  const alice = randomBytes(32).toString('hex'), bob = randomBytes(32).toString('hex');
  const target = { kind: 'text', selector: '#credit-formula', label: '普通抵免', quote: '实际抵免', prefix: '', suffix: '', version: '2026-11-16', context: { fields: [], buttons: [], details: [], hash: '' } };
  const payload = (body, extra = {}) => ({ id: randomUUID(), parentId: null, page: 'chapter-3.html', locale: 'cn', author: '接口验证', body, target, ...extra });
  async function call(path, method = 'GET', data, token, adminToken) {
    const response = await mf.dispatchFetch('http://localhost' + path, { method,
      headers: { 'Content-Type': 'application/json', ...(token ? { 'X-Author-Token': token } : {}), ...(adminToken ? { 'X-Admin-Token': adminToken } : {}) },
      body: data ? JSON.stringify(data) : undefined });
    return { status: response.status, data: await response.json() };
  }
  try {
    assert.equal((await call('/comments', 'POST', payload('权限验证'))).status, 401);
    const posted = await call('/comments', 'POST', payload('验证评论与计算参数的关联'), alice);
    assert.equal(posted.status, 201);
    const id = posted.data.comment.id;
    assert.equal((await call('/comments')).data.comments[0].canEdit, false);
    assert.equal((await call('/comments', 'GET', undefined, alice)).data.comments[0].canEdit, true);
    assert.equal((await call('/comments/' + id, 'PATCH', { revision: 1, author: '接口验证', body: '同名用户尝试编辑' }, bob)).status, 403);
    assert.equal((await call('/comments/' + id, 'DELETE', { revision: 1 }, bob)).status, 403);
    const edited = await call('/comments/' + id, 'PATCH', { revision: 1, body: '已验证作者编辑权限' }, alice);
    assert.equal(edited.data.comment.revision, 2);
    assert.equal((await call('/comments/' + id, 'PATCH', { revision: 1, body: '过期版本' }, alice)).status, 409);
    const moderated = await call('/comments/' + id, 'PATCH', { revision: 2, body: '已验证管理员编辑权限', state: 'resolved' }, bob, admin);
    assert.equal(moderated.status, 200);
    assert.equal(moderated.data.comment.state, 'resolved');
    assert.equal((await call('/session', 'GET', undefined, alice, bob)).status, 401);
    assert.equal((await call('/session', 'GET', undefined, alice, admin)).data.admin, true);
    const replied = await call('/comments', 'POST', payload('验证其他作者的回复保留', { parentId: id }), bob);
    assert.equal(replied.status, 201);
    assert.equal((await call('/comments/' + id, 'DELETE', { revision: 3 }, alice)).status, 200);
    const thread = (await call('/comments/' + id)).data.comments;
    assert.equal(thread[0].deleted, true);
    assert.equal(thread[0].body, '');
    assert.equal(thread[1].body, '验证其他作者的回复保留');
    assert.equal(JSON.stringify(thread).includes('owner_hash'), false);
    assert.equal((await call('/comments/' + replied.data.comment.id, 'DELETE', { revision: 1 }, alice, admin)).status, 200);
    assert.equal((await call('/comments')).data.comments.length, 0);
    assert.equal((await call('/comments', 'POST', payload('长度验证', { author: '' }), alice)).status, 400);
    assert.equal((await call('/comments', 'POST', payload('长度验证', { body: 'a'.repeat(4001) }), alice)).status, 400);
    const origin = await mf.dispatchFetch('http://localhost/comments', { headers: { Origin: 'https://unrelated.example' } });
    assert.equal(origin.status, 403);
    const preflight = await mf.dispatchFetch('http://localhost/comments', { method: 'OPTIONS', headers: { Origin: 'https://international-tax.github.io' } });
    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers.get('Access-Control-Allow-Origin'), 'https://international-tax.github.io');
    const repeat = payload('验证重复提交不会新增第二条评论');
    await call('/comments', 'POST', repeat, alice);
    await call('/comments', 'POST', repeat, alice);
    assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM comments WHERE id = ?').bind(repeat.id).first()).n, 1);
    await db.exec('DELETE FROM rate_windows');
    for (let i = 0; i < 30; i++) assert.equal((await call('/comments', 'POST', payload(`提交频率验证 ${i}`), alice)).status, 201);
    assert.equal((await call('/comments', 'POST', payload('超出提交频率'), alice)).status, 429);
    const first = (await call('/comments')).data;
    assert.equal(first.comments.length, 30);
    assert.ok(first.next);
    const second = (await call('/comments?before=' + encodeURIComponent(first.next))).data;
    assert.equal(second.comments.length, 1);
    assert.equal(new Set([...first.comments, ...second.comments].map(row => row.id)).size, 31);
  } finally { await mf.dispose(); }
});

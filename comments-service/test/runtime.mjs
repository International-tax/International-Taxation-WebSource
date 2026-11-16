import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { build } from 'esbuild';
import { readFile, mkdir } from 'node:fs/promises';
import { createHash, randomBytes } from 'node:crypto';
import { resolve } from 'node:path';

export async function runtime(port) {
  const directory = resolve('../.comment-work');
  await mkdir(directory, { recursive: true });
  const bundle = await build({ entryPoints: ['src/index.js'], bundle: true, format: 'esm', write: false, platform: 'browser' });
  const admin = randomBytes(32).toString('hex');
  const mf = new Miniflare(convertV4MiniflareOptions({
    script: bundle.outputFiles[0].text,
    modules: true,
    compatibilityDate: '2026-11-16',
    d1Databases: { DB: 'comments-tests' },
    bindings: { ADMIN_TOKEN_HASH: createHash('sha256').update(admin).digest('hex'), ALLOWED_ORIGINS: 'http://127.0.0.1:8000,http://localhost:8000,https://international-tax.github.io' },
    ...(port ? { port, host: '127.0.0.1' } : {}),
  }));
  const db = await mf.getD1Database('DB');
  const sql = await readFile('migrations/0001_comments.sql', 'utf8');
  await db.exec(sql);
  return { mf, db, admin };
}

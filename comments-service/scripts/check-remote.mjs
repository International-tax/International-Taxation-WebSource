import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { commentsConfig } from '../../assets/js/comments-config.js';

const token = (await readFile(join(homedir(), '.config/international-tax/comments-admin.txt'), 'utf8')).trim();
const headers = { Origin: 'https://international-tax.github.io', 'X-Admin-Token': token };
const session = await fetch(commentsConfig.api + '/session', { headers });
assert.equal(session.status, 200);
assert.equal((await session.json()).admin, true);
assert.equal(session.headers.get('Access-Control-Allow-Origin'), headers.Origin);
const comments = await fetch(commentsConfig.api + '/comments', { headers });
assert.equal(comments.status, 200);
assert.ok(Array.isArray((await comments.json()).comments));
const rejected = await fetch(commentsConfig.api + '/comments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
assert.equal(rejected.status, 401);
console.log('线上检查通过：管理员凭证、网站跨域访问、D1 读取、匿名写入权限校验。');

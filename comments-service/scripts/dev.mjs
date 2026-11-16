import { readFile, mkdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

const secrets = JSON.parse(await readFile(join(homedir(), '.config/international-tax/comments-secrets.json'), 'utf8'));
const temporary = resolve('../.comment-work/runtime');
await mkdir(temporary, { recursive: true });
const child = spawn(process.execPath, ['node_modules/cf/bin/cf', 'dev'], {
  env: { ...process.env, ...secrets, TMPDIR: temporary }, stdio: ['inherit', 'pipe', 'inherit'],
});
process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));
const ready = new Promise((resolveReady, reject) => {
  const timer = setTimeout(() => { child.kill(); reject(new Error('本地服务启动超时')); }, 30000);
  child.once('exit', code => { clearTimeout(timer); reject(new Error(`本地服务终止：${code}`)); });
  child.stdout.on('data', chunk => {
    process.stdout.write(chunk);
    if (chunk.toString().includes('Local:')) { clearTimeout(timer); resolveReady(); }
  });
});
await ready;
const endpoint = 'http://127.0.0.1:8787/cdn-cgi/local/explorer/api/d1/database/693558d1-3105-4177-aabf-df167e76c56f/raw';
async function query(sql) {
  const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sql }) });
  if (!response.ok) throw new Error(`本地数据库初始化失败：${response.status}`);
  const result = await response.json();
  if (!result.success) throw new Error(JSON.stringify(result.errors));
  return result;
}
const tables = await query("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'comments'");
if (!tables.result[0].results.rows.length) await query(await readFile('migrations/0001_comments.sql', 'utf8'));
console.log('本地评论数据库已就绪。');
const [code] = await once(child, 'exit');
process.exitCode = code;

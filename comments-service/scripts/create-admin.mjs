import { randomBytes, createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

const directory = join(homedir(), '.config', 'international-tax');
await mkdir(directory, { recursive: true, mode: 0o700 });
const token = randomBytes(32).toString('hex');
await writeFile(join(directory, 'comments-admin.txt'), token + '\n', { flag: 'wx', mode: 0o600 });
await writeFile(join(directory, 'comments-secrets.json'), JSON.stringify({ ADMIN_TOKEN_HASH: createHash('sha256').update(token).digest('hex') }), { flag: 'wx', mode: 0o600 });
console.log('管理员凭证已保存至 ' + join(directory, 'comments-admin.txt'));

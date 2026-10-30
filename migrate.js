import 'dotenv/config';
import { createClient } from '@libsql/client';
import { readFile } from 'node:fs/promises';

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  throw new Error('Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN before running migrations.');
}

const client = createClient({ url, authToken });
try {
  const schema = await readFile(new URL('./schema.sql', import.meta.url), 'utf8');
  await client.executeMultiple(schema);
  console.log('Turso schema is ready.');
} finally {
  await client.close();
}

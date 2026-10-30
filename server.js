import 'dotenv/config';
import { createServer } from 'node:http';
import { createClient } from '@libsql/client';

const port = Number(process.env.PORT ?? 8787);
const databaseConfigured = Boolean(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);
const client = databaseConfigured
  ? createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN })
  : null;

const server = createServer(async (request, response) => {
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');

  if (request.method === 'GET' && request.url === '/api/health') {
    if (!client) {
      response.writeHead(503);
      response.end(JSON.stringify({ status: 'setup_required', databaseConfigured: false, syncEnabled: false }));
      return;
    }

    try {
      await client.execute('SELECT 1');
      response.writeHead(200);
      response.end(JSON.stringify({ status: 'ok', databaseConfigured: true, syncEnabled: false }));
    } catch (error) {
      console.error('Turso health check failed.', error);
      response.writeHead(503);
      response.end(JSON.stringify({ status: 'database_unavailable', databaseConfigured: true, syncEnabled: false }));
    }
    return;
  }

  if (request.method === 'POST' && request.url === '/api/sync') {
    request.resume();
    response.writeHead(503);
    response.end(JSON.stringify({
      error: 'Cloud sync is disabled until authenticated access is configured.',
      syncEnabled: false,
    }));
    return;
  }

  response.writeHead(404);
  response.end(JSON.stringify({ error: 'Not found.' }));
});

server.listen(port, () => {
  console.log(`ArogyaMitra sync API listening on port ${port}.`);
});

function closeServer() {
  server.close();
  void client?.close();
}

process.on('SIGINT', closeServer);
process.on('SIGTERM', closeServer);

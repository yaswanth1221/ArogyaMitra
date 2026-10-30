# ArogyaMitra sync API

This service is the server-side foundation for a Turso/libSQL database. The web app continues to use IndexedDB while offline. Cloud sync is deliberately disabled until worker authentication and per-worker data access are implemented; `/api/sync` currently returns HTTP 503 and does not store or accept records.

## Configure Turso

1. Create a Turso database and an authentication token in the Turso dashboard.
2. Copy `.env.example` to `.env` and set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`. Keep `.env` private and never add secrets to `VITE_` variables or browser code.
3. Install dependencies with `npm install`.
4. Create the tables with `npm run migrate`.
5. Start the health endpoint with `npm start`; check `GET /api/health`.

The schema scopes records by `owner_id`, but the API does not assign that identity or allow writes yet. Do not expose this service as a data-sync endpoint until authenticated identity, authorization, and the corresponding web-app sign-in flow are implemented.

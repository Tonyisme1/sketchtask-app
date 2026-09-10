# SketchTask API database setup

The server uses PostgreSQL for both local development and production. The
database lives outside Render, so deploys and service restarts do not remove
application data.

## Configure the connection

1. Create two PostgreSQL databases in Supabase, Neon, or another provider:
   one for development and one for production.
2. Copy the development connection string into `server/.env` as
   `DATABASE_URL`.
3. Keep the URL in PostgreSQL format:

```env
# Runtime URL: Supabase transaction pooler (usually port 6543)
DATABASE_URL="postgresql://USER:PASSWORD@POOLER_HOST:6543/postgres?pgbouncer=true&connection_limit=1"
# Prisma migrations URL: Supabase session pooler (usually port 5432)
DIRECT_URL="postgresql://USER:PASSWORD@POOLER_HOST:5432/postgres"
```

Do not commit `server/.env` or paste passwords into source files.

## Local setup

From the repository root:

```powershell
npm install
npm --prefix server install
npm --prefix server run prisma:generate
npm --prefix server run prisma:migrate:deploy
npm run dev:server
```

In a second terminal, start the frontend:

```powershell
npm run dev
```

Open `http://localhost:5173`. Local development uses the development
database; never point it at the production database.

## Render setup

Set these environment variables on the Render web service:

```env
DATABASE_URL=postgresql://USER:PASSWORD@POOLER_HOST:6543/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://USER:PASSWORD@POOLER_HOST:5432/postgres
NODE_ENV=production
JWT_SECRET=<long-random-secret>
CORS_ORIGINS=https://sketchtask-app.vercel.app,capacitor://localhost,http://localhost
```

Remove any manually configured `PORT` variable so Render can provide the
runtime port. Set `Root Directory` to `server`, `Build Command` to
`npm install && npm run build`, and `Start Command` to `npm start`.

The build runs `prisma migrate deploy` before compiling the server. Existing
PostgreSQL data is preserved when the migrations are already recorded. The
old local SQLite file is not imported automatically; export it before
switching if it contains data that must be kept.

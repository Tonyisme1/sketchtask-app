# SketchTask API database setup

The server uses PostgreSQL. SQLite and `server/prisma/dev.db` are no longer used
at runtime; the old file is kept locally only as a data backup until it is
exported, if needed.

## Configure the connection

1. Create a PostgreSQL database in Supabase or another PostgreSQL provider.
2. Copy the provider's connection string into `server/.env` as `DATABASE_URL`.
3. Keep the URL in the PostgreSQL format, for example:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
```

Do not commit `server/.env` or paste the password into source files.

## Create the schema

From the repository root:

```powershell
npm --prefix server run prisma:generate
npm --prefix server run prisma:migrate:deploy
```

The production build runs both commands automatically before compiling the
server.

## Render

Set `DATABASE_URL` in the Render service to the PostgreSQL connection string
from the provider. Do not use `file:./dev.db` on Render. Keep `JWT_SECRET` and
`NODE_ENV` configured as service environment variables.

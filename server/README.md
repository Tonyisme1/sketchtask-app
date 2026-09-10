# SketchTask API database setup

The server uses SQLite for this personal app. The local database is
`server/prisma/dev.db`; production must point SQLite at a Render Persistent
Disk so the file survives deploys and restarts.

## Local setup

Copy `server/.env.example` to `server/.env` and keep:

```env
DATABASE_URL="file:./dev.db"
```

Then create/update the local schema:

```powershell
npm --prefix server run prisma:generate
npm --prefix server run prisma:push
```

Do not commit `server/.env` or paste secrets into source files.

## Render setup

SQLite is safe on Render only with a Persistent Disk. In the Render service:

1. Open `Settings` > `Disks` > `Add Disk`.
2. Set the mount path to `/var/data` and choose a size.
3. Keep the service at one instance; a disk is available to only one instance.
4. Add these environment variables:

```env
DATABASE_URL=file:/var/data/sketchtask.db
NODE_ENV=production
JWT_SECRET=<long-random-secret>
CORS_ORIGINS=https://sketchtask-app.vercel.app,capacitor://localhost,http://localhost
```

5. Set `Root Directory` to `server`.
6. Set `Build Command` to `npm install && npm run build`.
7. Set `Start Command` to `npm start`.

The start command runs `prisma db push` after the service disk is available,
then starts the API. This keeps an existing personal SQLite file and also
initializes a new empty disk. Keep automatic deploys enabled on `main`.

## Important limitations

Without a Persistent Disk, Render's filesystem is ephemeral and the SQLite
file disappears after a restart or deploy. A disk also prevents scaling this
service to multiple instances and removes zero-downtime deploys. For a
personal, single-instance app this is an acceptable tradeoff; for a shared or
multi-instance app, use a managed PostgreSQL database instead.

If the old PostgreSQL service contains important cloud data, export it before
switching. SQLite and PostgreSQL are separate databases and this change does
not copy existing cloud rows automatically.

# ServeHub Web App

This directory contains the Next.js web app that is intended for Vercel deployment.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production check

```bash
npm run build
```

## Demo behavior

The current web app is configured for demo mode.

- Bookings and appointments are stored in browser storage
- Booking timelines and chat threads are also stored locally
- No backend is required for the main demo flow

## Main demo routes

- `/`
- `/services`
- `/services/[id]`
- `/providers/[id]`
- `/book`
- `/bookings`
- `/bookings/confirmation`
- `/dashboard/bookings`

## Vercel

When creating the Vercel project, set the **Root Directory** to `frontend`.

The app builds with:

```bash
npm run build
```

No environment variables are required for the current demo setup.

## Notes

There are still Flutter-related files in this folder from earlier experiments, but the deployable web app for this repository is the Next.js app under `src/`.

# Vercel Deploy Notes

This repository contains multiple apps. The web app that should be deployed to Vercel is in `frontend/`.

## Recommended Vercel setup

1. Import the Git repository into Vercel.
2. In the project setup screen, set **Root Directory** to `frontend`.
3. Keep the detected framework as **Next.js**.
4. Add environment variables only if you want live API-backed flows:
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_WS_URL`

## Demo routes that work without backend data

- `/demo`
- `/browse?demo=1`

These routes use seeded frontend data and are safe for investor walkthroughs even if the backend is not deployed yet.

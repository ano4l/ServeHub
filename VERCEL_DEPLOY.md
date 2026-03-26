# Vercel Deploy Notes

This repository contains multiple applications. The web app that is ready for Vercel is the Next.js app in `frontend/`.

## Recommended Vercel setup

1. Import the Git repository into Vercel.
2. In the project setup screen, set **Root Directory** to `frontend`.
3. Keep the detected framework as **Next.js**.
4. Use the default build command: `npm run build`.

## Environment variables

No environment variables are required for the current demo build.

The booking flow, booking history, and demo chat all run from browser-side storage so investor or demo walkthroughs work even when no backend is deployed.

If you later switch the frontend out of demo mode and back onto the live API, the variables to add are:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_WS_URL`

## Demo routes verified without backend services

- `/`
- `/services`
- `/services/[id]`
- `/providers/[id]`
- `/book`
- `/bookings`
- `/bookings/confirmation`
- `/dashboard/bookings`

## Verification

- `npm run build` succeeds from `frontend/`
- Demo bookings and messages persist in browser storage
- Cart checkout to booking confirmation to booking chat was smoke-tested locally against the production build

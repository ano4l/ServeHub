# ServeHub Flutter Frontend

This `frontend` directory now includes a Flutter frontend scaffold for the ServeHub mobile app.

The Flutter entry point is [lib/main.dart](/c:/Users/anoti/OneDrive/Documents/ServeHub/frontend/lib/main.dart). The previous Next.js source remains in `src/` and related config files so the migration can happen incrementally.

## Run

Install the Flutter SDK, then from this directory run:

```bash
flutter pub get
flutter run -d chrome
```

You can also target Android or iOS once those platforms are generated on a machine with the Flutter SDK installed.

## What is included

- Mobile-first discovery cards for providers
- Booking state and failure-state UX
- Provider workspace summary
- Booking chat surface
- Admin operations overview
- Adaptive navigation for phones and larger tablet/web layouts

## Edge cases covered in the redesign

- Address ambiguity, landmarks, gate codes, and unit details before booking
- Price drift and quote changes with explicit approval
- Service-scope changes modeled like delivery substitutions
- ETA drift and reconnect-safe messaging
- Large text, RTL, and long-string layout pressure

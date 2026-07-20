# Flutter App

This folder contains the Flutter Android frontend source.

It currently includes:

- Login page
- Registration page
- Change password page
- Home page (post-login landing screen, with logout/change-password menu)
- Material app routing
- Shared app theme
- Shared authentication page shell

The `android/` runner project is already generated and committed, so you can
run the app directly:

```bash
flutter pub get
flutter run
```

If you ever need to regenerate or add another platform (e.g. iOS, web), run
from this folder:

```bash
flutter create .
```

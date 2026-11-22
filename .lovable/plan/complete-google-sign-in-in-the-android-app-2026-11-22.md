# Complete Google sign-in in the Android app

## What will change
- Open Google sign-in in the phone’s system browser instead of the app’s embedded page.
- Return to Saplant through an Android app link, validate the one-time sign-in state, and restore the session in the installed app.
- Use the same flow for Google sign-in and sign-up, including when Android resumes or relaunches Saplant.
- Add focused tests for valid callbacks, mismatched state, and provider errors; prepare a new debug APK if the Android build tools are available.

## Technical details
- Use Capacitor’s Browser and App plugins with a package-specific Android callback URI: `app.lovable.e9554181d8f446bfa847e6a0fb0213a2://oauth-callback`.
- Keep web sign-in unchanged and continue through Lovable Cloud’s managed Google broker; do not add Google credentials or change app permissions.
- The callback URI is not in the current allowed redirect list. It must be added under More → Users → Auth settings → Advanced before Google can return to the app; the project tools cannot edit that list.
- A physical-device sign-in cannot be fully confirmed here without completing Google’s account screen on a phone.

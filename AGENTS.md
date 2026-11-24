# Project architecture rules

- Fetch third-party RSS feeds through Lovable Cloud Edge Functions and render them in protected app pages, because feed providers do not consistently allow browser cross-origin requests.
- Planting details use `/app/planting/:id` as the canonical view for owner-visible and shared planting rows.
- Capacitor defaults to live preview; distributable Android builds bundle local web assets with `CAPACITOR_BUNDLE_ASSETS=1`. Android Google OAuth opens the hosted broker in the system browser, then validates a package-specific deep-link state before restoring the local session because localhost cannot serve the broker or receive HTTPS redirects.
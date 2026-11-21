# Project architecture rules

- Fetch third-party RSS feeds through Lovable Cloud Edge Functions and render them in protected app pages, because feed providers do not consistently allow browser cross-origin requests.
- Planting details use `/app/planting/:id` as the canonical view for owner-visible and shared planting rows.
- Capacitor defaults to live preview; distributable Android builds bundle local web assets with `CAPACITOR_BUNDLE_ASSETS=1`. Native Google OAuth uses the absolute published-origin broker because Android's localhost origin cannot serve `/~oauth/initiate`.
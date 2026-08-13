# FinCoach clickable prototype

This folder is ready to upload to a static host.

## Files
- `index.html`: self-contained clickable prototype
- `analytics.js`: lightweight event tracking hook
- `.nojekyll`: prevents GitHub Pages from treating the folder like a Jekyll site
- `README.md`: quick publish notes

## Analytics

The analytics helper records:
- screen views
- route/button clicks
- onboarding actions
- habit and settings interactions

By default it stores events in `window.__fincoachAnalyticsQueue` so the prototype still works even before you pick a provider.

To connect a provider later, set a small config before the analytics script runs:

```html
<script>
  window.FINCOACH_ANALYTICS = { provider: 'plausible' };
</script>
```

Or use `provider: 'posthog'` if you decide to wire PostHog.

## Publish options
- GitHub Pages: upload the folder contents to the root of a Pages branch.
- Netlify / Vercel / Cloudflare Pages: deploy this folder as the site root.

## Local preview
Open `index.html` directly or serve the folder with any static server.

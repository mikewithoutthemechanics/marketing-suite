Netlify deployment (quick guide)

1) Purpose
- These serverless functions expose the `generate-text` and `generate-image` endpoints for quick testing on Netlify.

2) Environment
- Set `FREE_MODEL_URL` to a local or hosted free LLM endpoint if available (recommended).
- Optionally set `ALLOW_PAID_MODELS=true` and `OPENROUTER_API_KEY` to enable paid providers.

3) Deploy
- Push this repo to GitHub and connect the `scheduler-app` folder as a Netlify site, or use the Netlify CLI:

```bash
cd scheduler-app
# install deps
npm ci
# build (no-op default)
npm run build
# deploy via Netlify CLI
netlify deploy --dir=public --functions=netlify/functions --prod
```

4) Test
- Health: `/.netlify/functions/health`
- Generate text: `/.netlify/functions/generate-text` (POST JSON payload matching `gen/text` signature)
- Generate image: `/.netlify/functions/generate-image` (POST JSON payload)

Notes: These functions are lightweight wrappers for demo/testing. For production, use a full backend (Docker compose) with database, queue, and worker services.

SkyReels v2
- To enable SkyReels v2 generation or hosting, set `SKYREELS_API_KEY` and optionally `SKYREELS_API_URL` in Netlify environment settings. The repo includes:
	- `connectors/skyreels.js` — posts or ingests videos to SkyReels.
	- `gen/skyreels.js` — requests SkyReels to render a video from a prompt.


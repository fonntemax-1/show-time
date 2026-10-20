# OpenWeather Worker — deployment

This Worker keeps the OpenWeather API key off the public GitHub Pages frontend.

## 1. Create the Worker

1. Sign in to the Cloudflare dashboard.
2. Open **Workers & Pages** and create a Worker.
3. Name it something like `show-time-weather`.
4. Copy the complete contents of `cloudflare/openweather-worker.js` from this repository into the Worker editor.
5. Deploy the Worker.

## 2. Add the API key as a secret

1. Open the deployed Worker, then **Settings → Variables and Secrets** (wording may vary).
2. Add a secret named exactly `OPENWEATHER_API_KEY`.
3. Paste a newly generated OpenWeather API key as the secret value.
4. Save and redeploy if Cloudflare asks.

**Never put the key in `index.html`, any other public file, a commit, or a normal/plain-text Worker variable.** If an API key has been shared publicly or in a chat, revoke it and create a replacement before use.

## 3. Test the Worker

Replace `YOUR-WORKER-URL` with the URL Cloudflare assigns. Open:

```
https://YOUR-WORKER-URL/?lat=-0.5022&lon=117.1537
```

The example coordinates are for Samarinda. A successful response should be JSON with `temperature`, `weatherCode`, `description`, and `city` fields. The browser may show a JSON error if the secret is missing or the provider rejects the key.

## 4. Connect it to the website

Do not change the live site's weather frontend until the deployed Worker URL has been tested. Then update only the weather-related functions in `index.html` so the frontend requests the Worker using coordinates for the selected kabupaten/kota. Keep the API key out of the frontend.

## Current status

The Worker source is committed to GitHub, but a file in GitHub is not deployed automatically to Cloudflare. The live site continues to use its existing weather provider until the Worker is deployed, tested, and connected to `index.html`.

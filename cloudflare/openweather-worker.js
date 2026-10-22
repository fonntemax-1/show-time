/**
 * OpenWeather proxy for fonntemax-1/show-time
 *
 * Deploy this file as a Cloudflare Worker, then add OPENWEATHER_API_KEY
 * as a Worker secret (never as a plain variable or in the public repository).
 *
 * After deployment, set the Worker URL in index.html in a separate,
 * reviewed change. This file alone does not change the live site's weather.
 */
const ALLOWED_ORIGIN = "https://fonntemax-1.github.io";

function json(data, status = 200, origin = ALLOWED_ORIGIN) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Cache-Control": "public, max-age=300",
      "Vary": "Origin"
    }
  });
}

function toWmoCode(weatherId, clouds) {
  if (weatherId >= 200 && weatherId < 300) return 95;
  if (weatherId >= 300 && weatherId < 400) return 51;
  if (weatherId >= 500 && weatherId < 600) return weatherId >= 502 ? 65 : 61;
  if (weatherId >= 600 && weatherId < 700) return 71;
  if (weatherId >= 700 && weatherId < 800) return 45;
  if (weatherId === 800) return 0;
  if (weatherId === 801) return 1;
  if (weatherId === 802) return 2;
  if (weatherId >= 803) return 3;
  const c = Number(clouds) || 0;
  return c < 20 ? 1 : c < 50 ? 2 : 3;
}

export default {
  async fetch(request, env) {
    try {
      const requestOrigin = request.headers.get("Origin") || "";
    // Browsers on the GitHub Pages site send the allowed Origin. Direct
    // navigation/testing often sends no Origin at all, which is safe to
    // permit here because Origin is a CORS signal, not authentication.
    const allowed = !requestOrigin || requestOrigin === ALLOWED_ORIGIN;
    const responseOrigin = requestOrigin || ALLOWED_ORIGIN;
    if (request.method === "OPTIONS") {
      if (!allowed) return new Response(null, { status: 403 });
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
          "Vary": "Origin"
        }
      });
    }
    if (request.method !== "GET") return json({ error: "Method not allowed" }, 405);
    if (!allowed) return json({ error: "Origin not allowed" }, 403, ALLOWED_ORIGIN);
    if (!env.OPENWEATHER_API_KEY) return json({ error: "Server weather key is not configured" }, 503);

    const incoming = new URL(request.url);
    const lat = Number(incoming.searchParams.get("lat"));
    const lon = Number(incoming.searchParams.get("lon"));
    if (!Number.isFinite(lat) || lat < -90 || lat > 90 ||
        !Number.isFinite(lon) || lon < -180 || lon > 180) {
      return json({ error: "Valid lat and lon query parameters are required" }, 400);
    }

    const cacheUrl = new URL("https://weather-proxy-cache.invalid/current");
    cacheUrl.searchParams.set("lat", lat.toFixed(3));
    cacheUrl.searchParams.set("lon", lon.toFixed(3));
    const cacheKey = new Request(cacheUrl.toString(), { method: "GET" });
    const cache = caches.default;
    // A cache read failure must not escape as an unhandled Worker 500 without
    // CORS headers. Treat the cache as unavailable and continue to OpenWeather.
    let cached = null;
    try {
      cached = await cache.match(cacheKey);
    } catch (error) {
      console.warn("Weather cache read failed; requesting OpenWeather directly.", error);
    }
    if (cached) {
      const headers = new Headers(cached.headers);
      headers.set("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
      headers.set("Vary", "Origin");
      return new Response(cached.body, { status: cached.status, headers });
    }

    const apiUrl = new URL("https://api.openweathermap.org/data/2.5/weather");
    apiUrl.searchParams.set("lat", String(lat));
    apiUrl.searchParams.set("lon", String(lon));
    apiUrl.searchParams.set("appid", env.OPENWEATHER_API_KEY);
    apiUrl.searchParams.set("units", "metric");
    apiUrl.searchParams.set("lang", "id");

    try {
      const upstream = await fetch(apiUrl.toString(), {
        headers: { "Accept": "application/json" }
      });
      if (!upstream.ok) {
        return json({
          error: upstream.status === 401 ? "OpenWeather API key is invalid or not activated" :
            upstream.status === 429 ? "OpenWeather rate limit reached" :
            "OpenWeather request failed",
          upstreamStatus: upstream.status
        }, upstream.status === 429 ? 429 : 502);
      }
      const data = await upstream.json();
      const temp = Number(data?.main?.temp);
      const weatherId = Number(data?.weather?.[0]?.id);
      if (!Number.isFinite(temp) || !Number.isFinite(weatherId)) {
        return json({ error: "OpenWeather returned incomplete current weather data" }, 502);
      }

      const payload = {
        current: {
          temperature_2m: temp,
          weather_code: toWmoCode(weatherId, data?.clouds?.all)
        },
        source: "OpenWeather",
        observedAt: Number.isFinite(Number(data.dt)) ? new Date(Number(data.dt) * 1000).toISOString() : null
      };
      const response = json(payload, 200);
      const cacheResponse = new Response(response.body, { status: response.status, headers: response.headers });
      await cache.put(cacheKey, cacheResponse);
      return response;
    } catch {
      return json({ error: "Unable to contact OpenWeather" }, 502);
    }
    } catch (error) {
      console.error("Unhandled weather Worker error:", error);
      return json({ error: "Internal weather Worker error" }, 500, ALLOWED_ORIGIN);
    }
  }
};

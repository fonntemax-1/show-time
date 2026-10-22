
const ALLOWED_ORIGIN = "https://fonntemax-1.github.io";

function respond(data, status = 200) {
  return new Response(
    data === null ? null : JSON.stringify(data),
    {
      status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Cache-Control": "no-store",
        "Vary": "Origin"
      }
    }
  );
}

function toWeatherCode(id, clouds) {
  if (id >= 200 && id < 300) return 95;
  if (id >= 300 && id < 400) return 51;
  if (id >= 500 && id < 600) return id >= 502 ? 65 : 61;
  if (id >= 600 && id < 700) return 71;
  if (id >= 700 && id < 800) return 45;
  if (id === 800) return 0;
  if (id === 801) return 1;
  if (id === 802) return 2;
  if (id >= 803) return 3;

  const c = Number(clouds) || 0;
  return c < 20 ? 1 : c < 50 ? 2 : 3;
}

export default {
  async fetch(request, env) {
    try {
      const origin = request.headers.get("Origin");

      if (origin && origin !== ALLOWED_ORIGIN) {
        return respond({ error: "Origin not allowed" }, 403);
      }

      if (request.method === "OPTIONS") {
        return respond(null, 204);
      }

      if (request.method !== "GET") {
        return respond({ error: "Method not allowed" }, 405);
      }

      if (!env.OPENWEATHER_API_KEY) {
        return respond({ error: "Weather API key is not configured" }, 503);
      }

      const url = new URL(request.url);
      const lat = Number(url.searchParams.get("lat"));
      const lon = Number(url.searchParams.get("lon"));

      if (
        !Number.isFinite(lat) || lat < -90 || lat > 90 ||
        !Number.isFinite(lon) || lon < -180 || lon > 180
      ) {
        return respond({ error: "Invalid latitude or longitude" }, 400);
      }

      const apiUrl = new URL(
        "https://api.openweathermap.org/data/2.5/weather"
      );
      apiUrl.searchParams.set("lat", String(lat));
      apiUrl.searchParams.set("lon", String(lon));
      apiUrl.searchParams.set("appid", env.OPENWEATHER_API_KEY);
      apiUrl.searchParams.set("units", "metric");
      apiUrl.searchParams.set("lang", "id");

      const upstream = await fetch(apiUrl.toString(), {
        headers: { Accept: "application/json" }
      });

      if (!upstream.ok) {
        console.error("OpenWeather HTTP status:", upstream.status);
        return respond({
          error: "OpenWeather request failed",
          upstreamStatus: upstream.status
        }, 502);
      }

      const data = await upstream.json();
      const temperature = Number(data?.main?.temp);
      const weatherId = Number(data?.weather?.[0]?.id);

      if (!Number.isFinite(temperature) ||
          !Number.isFinite(weatherId)) {
        return respond({
          error: "Incomplete weather data from OpenWeather"
        }, 502);
      }

      return respond({
        current: {
          temperature_2m: temperature,
          weather_code: toWeatherCode(
            weatherId,
            data?.clouds?.all
          )
        },
        source: "OpenWeather",
        observedAt: Number.isFinite(Number(data.dt))
          ? new Date(Number(data.dt) * 1000).toISOString()
          : null
      });
    } catch (error) {
      console.error("Weather Worker exception:", error);
      return respond({
        error: "Internal weather Worker error"
      }, 500);
    }
  }
};

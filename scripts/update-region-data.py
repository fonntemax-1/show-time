#!/usr/bin/env python3
"""Refresh Indonesia province/regency data used by the Show Time location dropdown."""
import json
import os
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

BASE = "https://emsifa.github.io/api-wilayah-indonesia/api"
OUT = Path("data/kabupaten-kota.json")


def fetch_json(url):
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "show-time-region-cache/1.0", "Accept": "application/json"},
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        if response.status != 200:
            raise RuntimeError(f"HTTP {response.status} while fetching {url}")
        return json.loads(response.read().decode("utf-8"))


def main():
    provinces = fetch_json(f"{BASE}/provinces.json")
    if not isinstance(provinces, list) or len(provinces) < 34:
        raise RuntimeError(f"Unexpected province count: {len(provinces) if isinstance(provinces, list) else 'not a list'}")

    result = []
    total_cities = 0
    for province in provinces:
        province_id = str(province["id"])
        cities = fetch_json(f"{BASE}/regencies/{province_id}.json")
        if not isinstance(cities, list) or not cities:
            raise RuntimeError(f"Empty/invalid regency list for province {province.get('name')}")
        normalized = [
            {"id": str(city["id"]), "name": str(city["name"]).strip()}
            for city in cities
            if city.get("id") and str(city.get("name", "")).strip()
        ]
        if not normalized:
            raise RuntimeError(f"No usable regencies for province {province.get('name')}")
        result.append({
            "id": province_id,
            "name": str(province["name"]).strip(),
            "cities": normalized,
        })
        total_cities += len(normalized)

    # Avoid replacing a good cache with a partial response.
    if len(result) < 34 or total_cities < 500:
        raise RuntimeError(f"Dataset looks incomplete: {len(result)} provinces, {total_cities} cities/regencies")

    payload = {
        "schemaVersion": 1,
        "updatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": BASE,
        "scheduleProvider": "AlAdhan API method 20 is queried after a city is selected",
        "provinceCount": len(result),
        "cityCount": total_cities,
        "provinces": result,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Saved {len(result)} provinces and {total_cities} regencies/cities to {OUT}")


if __name__ == "__main__":
    main()

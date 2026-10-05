# PLATE. — Restaurant recommendations, reimagined

A GitHub Pages frontend powered by a Cloudflare Python Worker API. Based on the original freshman-year Python project. **No production deployment has been performed.**

## Source data and scope

- `original/` preserves the two supplied Python files verbatim.
- `src/restaurantData.py` starts with the original dataset verbatim; later listings are appended after it (see *Finding more restaurants*). Edit that file to update the API data.
- The original script uses `restaurant[2]` as **price** and `restaurant[3]` as **rating**; we retain those columns exactly, even though some values look swapped and some names repeat. No deduplication, invented data, or verification.
- The original filters cuisine using a case-insensitive `startswith` match (twice via user input). The API retains case-insensitive prefix matching, adds optional price-score and minimum-rating filters, and keyword search.
- The 1–5 price number is not a dollar amount. Historical addresses, ratings and restaurant status are **not verified**.

## Finding more restaurants

`tools/find_restaurants.py` pulls Greensboro restaurants, cafés and fast-food spots from
[OpenStreetMap](https://www.openstreetmap.org/) via the public Overpass API. It does not scrape
review sites (Yelp, Google and TripAdvisor forbid it), and it never invents ratings or prices:
new listings get `None` for both, which the API already treats as unknown.

```
python tools/find_restaurants.py            # dry run: writes data/osm_candidates.csv to review
python tools/find_restaurants.py --apply    # append the new listings to src/restaurantData.py
```

- Only the city of Greensboro, NC (the boundary is scoped to North Carolina; other states have a Greensboro too).
- Skips brand-tagged chains (use `--include-chains` to keep them), places without a street address or a
  recognisable cuisine, lounges and campus dining halls, and anything already listed (by name, or by
  name plus street address, so "Seoul Garden" at 5318 W Market matches "Seoul Garden Restaurant").
- Rows are only appended, because the frontend stores favorites by row index. Each new row's
  OpenStreetMap link goes into `listing_sources`.
- OpenStreetMap data is ODbL-licensed: keep the "© OpenStreetMap contributors" credit in the site footer.
- If Python reports `CERTIFICATE_VERIFY_FAILED`, `pip install certifi`; the script uses it when available.
- The new data reaches the live site only after the Worker is redeployed (see Deploy below).

## Local development (Windows PowerShell)

1. Install [uv](https://docs.astral.sh/uv/getting-started/installation/) and make sure it works: `uv --version`.
2. At the repository root, run `uv run pywrangler dev`. Cloudflare normally serves the API at `http://localhost:8787`.
3. Set `window.PLATE_API_BASE = "http://localhost:8787";` in `config.js`.
4. In a second terminal at the root, run `python -m http.server 5500` (or use VS Code Live Server), then open `http://localhost:5500`.
5. Test `http://localhost:8787/api/health`, `http://localhost:8787/api/cuisines`, and `http://localhost:8787/api/recommendations?cuisine=ital&min_rating=4`.

The API CORS allowlist includes GitHub Pages and local development at `http://localhost:5500` / `http://127.0.0.1:5500`. If you use a different Live Server port, add its exact origin to `allow_origins` in `src/main.py`.


## Deploy (only when you're ready)

1. Run `uv run pywrangler login` if prompted by your Cloudflare account workflow; `uv run pywrangler deploy` from the repository root. Cloudflare will report your actual `https://...workers.dev` URL. A Worker deployed with this config has only an API; it does not serve the HTML.
2. Replace the placeholder in `config.js` with that exact Worker URL (no trailing slash).
3. Commit and push the frontend files (`index.html`, `config.js`, `js/app.js`) and Worker files to the repo. In GitHub repo **Settings → Pages → Deploy from a branch**, choose your publishing branch and `/(root)`.
4. Verify the public page loads and filters work; inspect the browser console and Cloudflare logs if not.

Cloudflare Python Workers use Pyodide and FastAPI via `workers.asgi`; free-tier limits include 100,000 requests/day and 10ms CPU time per request. Test the actual deployed Worker for CPU limits. Documentation: https://developers.cloudflare.com/workers/languages/python/packages/fastapi/ and https://developers.cloudflare.com/workers/platform/limits/ .

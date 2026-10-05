"""Find more Greensboro restaurants for PLATE from OpenStreetMap.

Uses the public Overpass API (OpenStreetMap data, ODbL licence: credit
"© OpenStreetMap contributors" wherever the data is shown). It does not scrape
review sites: Yelp, Google and TripAdvisor forbid scraping in their terms, and
PLATE does not invent ratings or prices. New listings get None for both.

Usage (from the repository root):
    python tools/find_restaurants.py            # dry run: writes data/osm_candidates.csv to review
    python tools/find_restaurants.py --apply    # append new listings to src/restaurantData.py
Options:
    --include-chains   keep places tagged with a brand (McDonald's, Olive Garden, ...)
    --input FILE       reuse a saved Overpass JSON response instead of querying again

Rows are only ever appended: js/app.js stores favorites by row index, so existing
rows must keep their positions.
"""
import argparse
import csv
import json
import pprint
import re
import ssl
import sys
import time
import unicodedata
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_FILE = ROOT / "src" / "restaurantData.py"
CANDIDATES_FILE = ROOT / "data" / "osm_candidates.csv"
RAW_FILE = ROOT / "data" / "osm_raw.json"
ENDPOINTS = ["https://overpass-api.de/api/interpreter", "https://maps.mail.ru/osm/tools/overpass/api/interpreter"]
USER_AGENT = "PLATE-restaurant-finder/1.0 (github.com/Khefney/Recommendation-Program)"
# Several US towns are called Greensboro: scope the city boundary to North Carolina.
QUERY = """[out:json][timeout:90];
area["ISO3166-2"="US-NC"]->.nc;
rel(area.nc)["name"="Greensboro"]["boundary"="administrative"]["admin_level"="8"];
map_to_area->.city;
nwr["amenity"~"^(restaurant|cafe|fast_food)$"]["name"](area.city);
out center tags;"""
GREENSBORO_BOX = (35.95, 36.25, -80.05, -79.65)  # south, north, west, east: guard against stray matches

# OSM cuisine tag -> PLATE cuisine. Only cuisines js/app.js has an illustration for;
# ambiguous tags (asian, regional, international, buffet) and dessert/drink shops are skipped.
CUISINE_MAP = {
    "american": "american", "burger": "american", "steak_house": "american", "steak": "american",
    "grill": "american", "wings": "american", "chicken": "american", "fried_chicken": "american",
    "hot_dog": "american", "sandwich": "american", "deli": "american", "diner": "american",
    "breakfast": "breakfast", "pancake": "breakfast", "bagel": "breakfast", "brunch": "breakfast",
    "coffee_shop": "cafe", "coffee": "cafe", "tea": "cafe",
    "italian": "italian", "pasta": "italian", "pizza": "pizza",
    "mexican": "mexican", "tex-mex": "mexican", "tacos": "mexican",
    "latin_american": "latin", "salvadoran": "latin", "brazilian": "latin", "colombian": "latin",
    "peruvian": "peruvian", "jamaican": "caribbean", "caribbean": "caribbean", "cuban": "caribbean",
    "african": "african", "ethiopian": "african", "senegal": "african", "senegalese": "african", "nigerian": "african",
    "japanese": "japanese", "sushi": "japanese", "ramen": "japanese", "chinese": "chinese",
    "korean": "korean", "vietnamese": "vietnamese", "thai": "thai", "indian": "indian",
    "mediterranean": "mediterranean", "greek": "mediterranean", "lebanese": "mediterranean",
    "turkish": "mediterranean", "middle_eastern": "mediterranean", "kebab": "mediterranean",
    "pita": "mediterranean", "falafel": "mediterranean",
    "french": "french", "german": "german", "czech": "czech", "barbecue": "barbecue", "bbq": "barbecue",
    "seafood": "seafood", "fish": "seafood", "southern": "southern", "soul_food": "southern",
    "vegetarian": "vegetarian", "vegan": "vegetarian",
}


def ssl_context():
    # Some Windows Python installs ship an outdated trust store; prefer certifi when present.
    try:
        import certifi
        return ssl.create_default_context(cafile=certifi.where())
    except ImportError:
        return ssl.create_default_context()


def fetch_overpass():
    body = urllib.parse.urlencode({"data": QUERY}).encode()
    last_error = None
    for attempt, url in enumerate(ENDPOINTS * 2):
        try:
            request = urllib.request.Request(url, data=body, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(request, timeout=150, context=ssl_context()) as response:
                return json.load(response)
        except Exception as error:  # busy public servers return 429/504; back off and retry
            last_error = error
            print(f"  Overpass attempt {attempt + 1} failed ({error}); retrying…", file=sys.stderr)
            time.sleep(10 * (attempt + 1))
    raise SystemExit(f"Could not reach Overpass: {last_error}")


# Generic tags lose to a specific cuisine: "steak_house;brazilian" is latin, not american.
GENERIC = {"american", "burger", "steak_house", "steak", "grill", "wings", "chicken", "fried_chicken", "hot_dog",
           "sandwich", "deli", "diner", "coffee_shop", "coffee", "tea", "bubble_tea", "dessert"}
NOT_RESTAURANTS = {"hookah", "shisha", "vape"}
NAME_NOISE = {"the", "and", "restaurant", "restaurante", "grill", "grille", "cuisine", "kitchen", "bar", "cafe",
              "bistro", "co", "company", "of", "gso", "greensboro", "express", "house", "pho", "more"}
DIRECTIONS = {"n", "s", "e", "w", "north", "south", "east", "west"}
CUISINE_MAP.update({"bubble_tea": "cafe", "dessert": "cafe", "brazilian": "latin"})


def fold(text):
    text = unicodedata.normalize("NFKD", text.casefold().replace("’", "'").replace("&", " and "))
    return "".join(ch for ch in text if not unicodedata.combining(ch))


def normalize(name):
    return re.sub(r"[^a-z0-9]+", "", re.sub(r"^the\s+", "", fold(name)))


def name_words(name):
    return {w for w in re.findall(r"[a-z0-9]+", fold(name).replace("'", "")) if w not in NAME_NOISE and len(w) > 1}


def address_key(street_address):
    """'5318 W Market St Ste C' and '5318 West Market Street' both become '5318 market'."""
    words = re.findall(r"[a-z0-9]+", fold(street_address))
    if not words:
        return ""
    rest = [w for w in words[1:] if w not in DIRECTIONS]
    return f"{words[0]} {rest[0] if rest else ''}"


def is_duplicate(name, street_address, known):
    """Known = [(normalized name, words, address key)]. Same name anywhere, one name extending the other,
    or a shared distinctive word at the same street address all count as the same place."""
    key, words, where = normalize(name), name_words(name), address_key(street_address)
    for other_key, other_words, other_where in known:
        if key == other_key:
            return True
        if min(len(key), len(other_key)) >= 5 and (key.startswith(other_key) or other_key.startswith(key)):
            return True
        if where == other_where and words & other_words:
            return True
    return False


def plate_cuisine(tags):
    raw_tags = [t.strip().casefold() for t in tags.get("cuisine", "").split(";")]
    mapped = [CUISINE_MAP[raw] for raw in raw_tags if raw in CUISINE_MAP]
    specific = [CUISINE_MAP[raw] for raw in raw_tags if raw in CUISINE_MAP and raw not in GENERIC]
    if specific:
        return specific[0]
    if mapped:
        return mapped[0]
    return "cafe" if tags.get("amenity") == "cafe" else None


def address(tags):
    number, street = tags.get("addr:housenumber", "").strip(), tags.get("addr:street", "").strip().rstrip(".")
    if not number or not street:
        return None
    unit = re.sub(r"^(suite|ste\.?|unit|#)\s*", "", tags.get("addr:unit", "").strip(), flags=re.I)
    return f"{number} {street}" + (f" Ste {unit}" if unit else "")


def osm_url(element):
    return f"https://www.openstreetmap.org/{element['type']}/{element['id']}"


def build_candidates(elements, existing_rows, include_chains):
    known = [(normalize(row[1]), name_words(row[1]), address_key(row[4])) for row in existing_rows]
    candidates = []
    skipped = {"outside Greensboro": 0, "chain": 0, "not a restaurant": 0, "no address": 0,
               "no usable cuisine": 0, "already listed": 0, "closed": 0}
    for element in sorted(elements, key=lambda e: (e["tags"].get("name", "").casefold(), e["id"])):
        tags = element.get("tags", {})
        name = tags.get("name", "").strip()
        lat, lon = element.get("lat", element.get("center", {}).get("lat")), element.get("lon", element.get("center", {}).get("lon"))
        south, north, west, east = GREENSBORO_BOX
        if lat is None or not (south <= lat <= north and west <= lon <= east):
            skipped["outside Greensboro"] += 1; continue
        if tags.get("opening_hours", "").strip().casefold() in {"off", "closed"}:
            skipped["closed"] += 1; continue
        if not include_chains and (tags.get("brand") or tags.get("brand:wikidata")):
            skipped["chain"] += 1; continue
        raw_cuisines = [t.strip().casefold() for t in tags.get("cuisine", "").split(";") if t.strip()]
        # Lounges, and cafeterias tagged with every cuisine on campus (dining halls), are not restaurants.
        if NOT_RESTAURANTS & set(raw_cuisines) or len(raw_cuisines) > 6:
            skipped["not a restaurant"] += 1; continue
        street_address = address(tags)
        if not street_address:
            skipped["no address"] += 1; continue
        cuisine = plate_cuisine(tags)
        if not cuisine:
            skipped["no usable cuisine"] += 1; continue
        if is_duplicate(name, street_address, known):
            skipped["already listed"] += 1; continue
        known.append((normalize(name), name_words(name), address_key(street_address)))
        candidates.append({"cuisine": cuisine, "name": name, "address": street_address, "source": osm_url(element),
                           "osm_cuisine": tags.get("cuisine", ""), "amenity": tags.get("amenity", ""),
                           "check_date": tags.get("check_date", "")})
    return candidates, skipped


def apply_to_dataset(candidates, module):
    """Append rows and sources to src/restaurantData.py without reformatting existing lines."""
    text = DATA_FILE.read_text(encoding="utf-8")
    rows = "".join(f",\n {pprint.pformat([c['cuisine'], c['name'], None, None, c['address']], width=200)}" for c in candidates)
    data_end = text.index("]]\n\nlisting_sources")
    text = text[:data_end + 1] + rows + text[data_end + 1:]
    sources = "".join(f",\n {c['name']!r}: {c['source']!r}" for c in candidates)
    sources_end = text.rindex("}")
    text = text[:sources_end] + sources + text[sources_end:]
    new_types = sorted(set(module.types) | {c["cuisine"] for c in candidates})
    types_start = text.index("types = ")
    types_end = text.index("\n\nrestaurant_data = ")
    text = text[:types_start] + "types = " + pprint.pformat(new_types) + text[types_end:]
    DATA_FILE.write_text(text, encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--apply", action="store_true", help="append new listings to src/restaurantData.py")
    parser.add_argument("--include-chains", action="store_true", help="keep brand-tagged chain locations")
    parser.add_argument("--input", type=Path, help="reuse a saved Overpass JSON response")
    args = parser.parse_args()

    sys.path.insert(0, str(DATA_FILE.parent))
    import restaurantData as module

    if args.input:
        raw = json.loads(args.input.read_text(encoding="utf-8"))
    else:
        print("Querying OpenStreetMap (Overpass) for Greensboro restaurants, cafés and fast food…")
        raw = fetch_overpass()
        RAW_FILE.parent.mkdir(exist_ok=True)
        RAW_FILE.write_text(json.dumps(raw), encoding="utf-8")
    elements = raw.get("elements", [])
    candidates, skipped = build_candidates(elements, module.restaurant_data, args.include_chains)

    CANDIDATES_FILE.parent.mkdir(exist_ok=True)
    with CANDIDATES_FILE.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(candidates[0]) if candidates else ["name"])
        writer.writeheader()
        writer.writerows(candidates)

    print(f"{len(elements)} places in OpenStreetMap; {len(candidates)} new listings.")
    print("Skipped: " + ", ".join(f"{count} {reason}" for reason, count in skipped.items()))
    by_cuisine = {}
    for c in candidates:
        by_cuisine[c["cuisine"]] = by_cuisine.get(c["cuisine"], 0) + 1
    print("New by cuisine: " + ", ".join(f"{k} {v}" for k, v in sorted(by_cuisine.items(), key=lambda kv: -kv[1])))
    print(f"Review list: {CANDIDATES_FILE.relative_to(ROOT)}")

    if args.apply and candidates:
        apply_to_dataset(candidates, module)
        print(f"Appended {len(candidates)} listings to {DATA_FILE.relative_to(ROOT)}.")
    elif not args.apply:
        print("Dry run only. Re-run with --apply to add them to the dataset.")


if __name__ == "__main__":
    main()

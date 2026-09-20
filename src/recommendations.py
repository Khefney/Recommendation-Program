"""PLATE recommendation engine adapted from the original prefix-match program.

The original dataset is preserved as-is. Columns are cuisine, name, price, rating,
address according to the original print statements; values are historical,
user-curated data and are NOT live prices or verified ratings.
"""
from restaurantData import restaurant_data, types


def cuisines(prefix=""):
    prefix = prefix.strip().casefold()
    return [name for name in types if name.casefold().startswith(prefix)]


def recommend(cuisine="", max_price=None, min_rating=None, search=""):
    cuisine = cuisine.strip().casefold()
    search = search.strip().casefold()
    matches = []
    for index, record in enumerate(restaurant_data):
        kind, name, price_text, rating_text, address = record
        # The source dataset has contradictory entries; never merge them blindly.
        price, rating = float(price_text), float(rating_text)
        if cuisine and not kind.casefold().startswith(cuisine):
            continue
        if max_price is not None and price > max_price:
            continue
        if min_rating is not None and rating < min_rating:
            continue
        if search and search not in f"{name} {kind} {address}".casefold():
            continue
        matches.append({"id": index, "cuisine": kind, "name": name,
                        "price": price, "rating": rating, "address": address})
    return matches

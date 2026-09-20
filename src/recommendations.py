"""PLATE recommendations: original cuisine-prefix logic plus optional filters."""
from restaurantData import restaurant_data, types

def cuisines(prefix=""):
    prefix = prefix.strip().casefold()
    return [name for name in types if name.casefold().startswith(prefix)]

def recommend(cuisine="", max_price=None, min_rating=None, search=""):
    cuisine, search = cuisine.strip().casefold(), search.strip().casefold()
    matches = []
    for index, (kind, name, price_value, rating_value, address) in enumerate(restaurant_data):
        price = float(price_value) if price_value is not None else None
        rating = float(rating_value) if rating_value is not None else None
        if cuisine and not kind.casefold().startswith(cuisine):
            continue
        if max_price is not None and (price is None or price > max_price):
            continue
        if min_rating is not None and (rating is None or rating < min_rating):
            continue
        if search and search not in f"{name} {kind} {address}".casefold():
            continue
        matches.append({"id": index, "cuisine": kind, "name": name,
                        "price": price, "rating": rating, "address": address})
    return matches

"""PLATE Python API deployed as a Cloudflare Python Worker."""
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from workers import asgi
from recommendations import cuisines, recommend

app = FastAPI(title="PLATE API", version="0.1.0")
# Public read-only API: restrict browser access to the published GitHub Pages origin.
app.add_middleware(CORSMiddleware,
    allow_origins=["https://khefney.github.io", "http://localhost:5500", "http://127.0.0.1:5500"],
    allow_methods=["GET"], allow_headers=["*"], allow_credentials=False)

@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.get("/api/cuisines")
def get_cuisines(prefix: str = Query(default="", max_length=60)):
    return {"cuisines": cuisines(prefix)}

@app.get("/api/recommendations")
def get_recommendations(
    cuisine: str = Query(default="", max_length=60),
    max_price: float | None = Query(default=None, ge=0, le=5),
    min_rating: float | None = Query(default=None, ge=0, le=5),
    search: str = Query(default="", max_length=120),
):
    matches = recommend(cuisine, max_price, min_rating, search)
    return {"count": len(matches), "restaurants": matches,
            "note": "Historical project dataset; restaurant details, prices and ratings are unverified."}

Default = asgi.entrypoint(app)

"use strict";
const apiBase = String(window.PLATE_API_BASE || "").replace(/\/$/, "");
const search = document.querySelector("#search");
const budget = document.querySelector("#budget");
const rating = document.querySelector("#rating");
const chips = document.querySelector("#cuisines");
const results = document.querySelector("#results");
const count = document.querySelector("#count");
const shuffle = document.querySelector("#shuffle");
let selected = "";
let cuisineNames = [];
let matches = [];
let surprise = null;
let pending = null;
let requestId = 0;
let favorites = [];
try {
  const saved = JSON.parse(localStorage.getItem("plate-favorites-v2") || "[]");
  favorites = Array.isArray(saved) ? saved : [];
} catch { /* storage may be unavailable */ }
const tones = ["#d58b59", "#c37b58", "#83a29b", "#e3aa5f", "#c77a61", "#deb97b"];
const emojiByCuisine = { american:"🍔", italian:"🍝", japanese:"🍣", mexican:"🌮", chinese:"🥡", cafe:"☕", pizza:"🍕", thai:"🍜", indian:"🍛", french:"🥐", barbecue:"🍖", mediterranean:"🥙", vegetarian:"🥗", african:"🍲", czech:"🥘", german:"🥨" };
function renderChips() {
  chips.replaceChildren();
  for (const name of ["", ...cuisineNames]) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chip";
    button.textContent = name || "All";
    button.setAttribute("aria-pressed", String(selected === name));
    button.addEventListener("click", () => { selected = name; surprise = null; fetchResults(); });
    chips.append(button);
  }
}
function showMessage(message) {
  results.replaceChildren();
  const paragraph = document.createElement("p");
  paragraph.className = "empty";
  paragraph.textContent = message;
  results.append(paragraph);
}
function render() {
  renderChips();
  const visible = surprise === null ? matches : matches.filter(r => r.id === surprise);
  count.textContent = surprise !== null && visible.length ? "Your surprise pick" : `${visible.length} ${visible.length === 1 ? "place" : "places"} to explore`;
  results.replaceChildren();
  if (!visible.length) return showMessage("No matches. Try another cuisine, price score, or rating.");
  for (const r of visible) {
    const article = document.createElement("article"); article.className = "restaurant";
    const art = document.createElement("div"); art.className = "art";
    art.style.setProperty("--tone", tones[r.id % tones.length]);
    art.textContent = emojiByCuisine[r.cuisine.toLowerCase()] || "🍽️";
    art.setAttribute("aria-hidden", "true");
    const content = document.createElement("div"); content.className = "content";
    const meta = document.createElement("div"); meta.className = "meta";
    meta.textContent = `${r.cuisine} · Price ${r.price}/5 · ★ ${r.rating}/5`;
    const title = document.createElement("h3"); title.textContent = r.name;
    const address = document.createElement("p"); address.textContent = r.address + ", Greensboro, NC (historical listing)";
    const footer = document.createElement("div"); footer.className = "footer";
    const link = document.createElement("a");
    link.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.name + " " + r.address + " Greensboro NC")}`;
    link.target = "_blank"; link.rel = "noopener noreferrer"; link.textContent = "Search on Maps ↗";
    const fav = document.createElement("button"); fav.type = "button"; fav.className = "favorite";
    fav.setAttribute("aria-label", `Save ${r.name}`);
    fav.setAttribute("aria-pressed", String(favorites.includes(r.id)));
    fav.textContent = favorites.includes(r.id) ? "♥ Saved" : "♡ Save";
    fav.addEventListener("click", () => {
      favorites = favorites.includes(r.id) ? favorites.filter(id => id !== r.id) : [...favorites, r.id];
      try { localStorage.setItem("plate-favorites-v2", JSON.stringify(favorites)); } catch {}
      render();
    });
    footer.append(link, fav); content.append(meta, title, address, footer);
    article.append(art, content); results.append(article);
  }
}
async function getJSON(path, signal) {
  const response = await fetch(apiBase + path, { signal });
  if (!response.ok) throw new Error(`API returned ${response.status}`);
  return response.json();
}
async function fetchResults() {
  if (pending) pending.abort();
  pending = new AbortController();
  const id = ++requestId;
  surprise = null;
  count.textContent = "Finding your matches…";
  const params = new URLSearchParams();
  if (selected) params.set("cuisine", selected);
  if (budget.value !== "all") params.set("max_price", budget.value);
  if (rating.value !== "0") params.set("min_rating", rating.value);
  if (search.value.trim()) params.set("search", search.value.trim());
  try {
    const data = await getJSON("/api/recommendations?" + params.toString(), pending.signal);
    if (id !== requestId) return;
    matches = data.restaurants; render();
  } catch (error) {
    if (error.name === "AbortError" || id !== requestId) return;
    matches = [];
    count.textContent = "API unavailable";
    showMessage("Couldn't reach the Python API. Check config.js, start the Worker, then refresh. " + error.message);
  }
}
async function start() {
  if (apiBase.includes("REPLACE-WITH") || !/^https?:\/\//.test(apiBase)) {
    count.textContent = "Configure your Python API";
    showMessage("Deploy or start the Python Worker, then set its URL in config.js.");
    return;
  }
  try {
    const data = await getJSON("/api/cuisines");
    cuisineNames = data.cuisines;
    await fetchResults();
  } catch (error) {
    count.textContent = "API unavailable";
    showMessage("Couldn't connect to the Python API. Check config.js and your Worker. " + error.message);
  }
}
let debounce;
search.addEventListener("input", () => { clearTimeout(debounce); debounce = setTimeout(fetchResults, 220); });
[budget, rating].forEach(el => el.addEventListener("change", fetchResults));
shuffle.addEventListener("click", () => {
  if (!matches.length) return;
  const candidates = matches.length > 1 ? matches.filter(r => r.id !== surprise) : matches;
  surprise = candidates[Math.floor(Math.random() * candidates.length)].id;
  render();
});
start();

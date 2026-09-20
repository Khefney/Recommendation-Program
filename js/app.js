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
// Self-contained vector illustrations: no emoji fonts or external assets needed.
const cuisineIllustration = {
  american: "burger", barbecue: "burger", southern: "burger", german: "burger",
  italian: "pasta", french: "pasta", czech: "pasta",
  japanese: "sushi", korean: "sushi", chinese: "sushi",
  mexican: "taco", latin: "taco", peruvian: "taco",
  pizza: "pizza", vegetarian: "salad", mediterranean: "salad", african: "salad",
  cafe: "coffee", breakfast: "coffee",
  thai: "noodles", vietnamese: "noodles", indian: "curry", seafood: "sushi", caribbean: "curry"
};
const foodDrawings = {
  burger: `<ellipse cx="80" cy="94" rx="46" ry="8" fill="#7B402B"/><path d="M34 83 Q80 71 126 83 L120 97 Q80 106 40 97Z" fill="#D99A4E"/><rect x="34" y="76" width="92" height="13" rx="6" fill="#6E382B"/><path d="M31 75 Q55 62 81 73 Q105 62 129 75 Q121 84 110 77 Q100 85 89 78 Q70 85 53 78 Q41 83 31 75Z" fill="#6C9E4C"/><path d="M34 71 Q36 37 80 37 Q124 37 126 71Z" fill="#DDA65B" stroke="#B47B3C" stroke-width="2"/><g fill="#FFF0C5"><ellipse cx="57" cy="53" rx="3" ry="1.5" transform="rotate(25 57 53)"/><ellipse cx="85" cy="46" rx="3" ry="1.5" transform="rotate(-25 85 46)"/><ellipse cx="105" cy="56" rx="3" ry="1.5"/></g>`,
  pasta: `<g fill="none" stroke="#E9B34D" stroke-width="7" stroke-linecap="round"><path d="M47 62 C35 35 89 33 82 61 S45 100 59 79 S116 48 113 76 S64 101 83 82"/><path d="M54 48 C74 35 105 58 94 84 S49 91 49 73 S98 39 112 63"/></g><g fill="#C34F38"><circle cx="52" cy="53" r="8"/><circle cx="102" cy="83" r="8"/><circle cx="76" cy="76" r="6"/></g><g fill="#4F8542"><path d="M80 47 Q61 28 60 49 Q70 56 80 47Z"/><path d="M80 47 Q97 25 100 46 Q90 54 80 47Z"/><path d="M87 93 Q103 77 111 96 Q96 104 87 93Z"/></g>`,
  sushi: `<g transform="rotate(-12 80 80)"><rect x="37" y="45" width="33" height="40" rx="9" fill="#203A30"/><rect x="41" y="49" width="25" height="31" rx="7" fill="#F5F1DF"/><rect x="47" y="55" width="14" height="17" rx="6" fill="#E78A55"/><rect x="76" y="41" width="36" height="42" rx="9" fill="#203A30"/><rect x="80" y="46" width="28" height="32" rx="7" fill="#F5F1DF"/><rect x="86" y="52" width="16" height="18" rx="6" fill="#E78A55"/><rect x="56" y="87" width="43" height="28" rx="12" fill="#F5F1DF"/><path d="M55 91 Q78 70 102 91 Q95 103 55 102Z" fill="#F08C6C"/></g><path d="M102 93 Q120 89 123 103 Q106 108 102 93Z" fill="#80A064"/>`,
  taco: `<path d="M32 86 Q41 24 86 35 Q123 40 128 93 Q81 112 32 86Z" fill="#E7B456" stroke="#B77E37" stroke-width="3"/><path d="M36 84 Q53 46 83 46 Q112 49 124 89 Q91 105 36 84Z" fill="#8B4D2F"/><path d="M37 75 Q56 49 76 67 Q96 48 122 79" fill="none" stroke="#5B964D" stroke-width="14" stroke-linecap="round"/><g fill="#CE5346"><circle cx="57" cy="73" r="5"/><circle cx="92" cy="72" r="6"/><circle cx="109" cy="83" r="4"/></g><path d="M44 91 Q83 107 123 94" stroke="#F9D788" stroke-width="8" stroke-linecap="round" fill="none"/>`,
  pizza: `<path d="M30 38 Q82 29 129 41 L83 122Z" fill="#E8B351" stroke="#B47A38" stroke-width="3"/><path d="M30 38 Q82 20 129 41" fill="none" stroke="#B87B3E" stroke-width="13" stroke-linecap="round"/><path d="M45 48 Q80 38 114 49 L82 102Z" fill="#E6C66F"/><g fill="#C2503C"><circle cx="77" cy="54" r="10"/><circle cx="91" cy="77" r="10"/><circle cx="64" cy="75" r="8"/></g><g fill="#578647"><path d="M84 59 Q97 52 99 62 Q92 68 84 59Z"/><path d="M70 88 Q55 80 57 94 Q67 98 70 88Z"/></g>`,
  salad: `<path d="M31 74 Q34 118 80 120 Q126 118 129 74Z" fill="#D9E4DF" stroke="#A2BDB0" stroke-width="3"/><ellipse cx="80" cy="75" rx="49" ry="29" fill="#75A46A"/><g fill="#A2C678"><ellipse cx="49" cy="64" rx="16" ry="11" transform="rotate(30 49 64)"/><ellipse cx="81" cy="51" rx="20" ry="11" transform="rotate(-20 81 51)"/><ellipse cx="113" cy="69" rx="16" ry="11" transform="rotate(-30 113 69)"/></g><g fill="#DE5848"><circle cx="60" cy="78" r="9"/><circle cx="104" cy="74" r="8"/></g><g fill="#F0D18A"><circle cx="81" cy="68" r="7"/><circle cx="85" cy="89" r="6"/></g>`,
  coffee: `<ellipse cx="79" cy="112" rx="49" ry="9" fill="#C4B3A0"/><path d="M37 52 H113 L107 106 Q80 118 45 106Z" fill="#FEF8E9" stroke="#CFBEA3" stroke-width="3"/><path d="M111 61 Q141 55 138 78 Q133 95 108 91" fill="none" stroke="#F7EDD7" stroke-width="10"/><ellipse cx="75" cy="53" rx="38" ry="10" fill="#603E2D"/><path d="M57 34 Q48 23 59 15 M79 32 Q70 22 79 11 M97 34 Q89 22 99 14" fill="none" stroke="#DACBBB" stroke-width="4" stroke-linecap="round"/>`,
  noodles: `<path d="M33 75 Q37 115 80 119 Q123 115 128 75Z" fill="#D7E8E5" stroke="#97B7B0" stroke-width="3"/><ellipse cx="80" cy="74" rx="47" ry="24" fill="#8F5738"/><g fill="none" stroke="#F4D48C" stroke-width="5" stroke-linecap="round"><path d="M46 70 Q63 51 83 70 T112 70"/><path d="M49 79 Q71 58 91 78 T114 78"/><path d="M60 86 Q74 68 91 85"/></g><path d="M91 67 L133 26 M98 71 L143 34" stroke="#6A432E" stroke-width="5" stroke-linecap="round"/><g fill="#64A269"><circle cx="56" cy="67" r="6"/><circle cx="91" cy="82" r="5"/></g>`,
  curry: `<path d="M30 74 Q33 117 80 121 Q126 117 130 74Z" fill="#F1E1C9" stroke="#D0B99A" stroke-width="3"/><ellipse cx="80" cy="75" rx="50" ry="27" fill="#B96A37"/><g fill="#EBC56C"><circle cx="56" cy="69" r="13"/><circle cx="89" cy="64" r="14"/><circle cx="107" cy="83" r="11"/><circle cx="70" cy="89" r="10"/></g><g fill="#57884C"><path d="M63 62 Q75 40 84 59 Q77 69 63 62Z"/><path d="M83 82 Q99 66 108 80 Q99 90 83 82Z"/></g>`
};
function restaurantPlateSvg(cuisine) {
  const kind = cuisineIllustration[String(cuisine || "").toLowerCase()] || "salad";
  const food = foodDrawings[kind];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160" aria-hidden="true"><ellipse cx="83" cy="139" rx="63" ry="11" fill="#382C2650"/><circle cx="80" cy="77" r="67" fill="#D7D0C2"/><circle cx="80" cy="73" r="65" fill="#FFF9EC"/><circle cx="80" cy="73" r="52" fill="#EAE3D5"/><circle cx="80" cy="73" r="46" fill="#FDF9F0"/>${food}</svg>`;
}

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
    const foodImage = document.createElement("img");
    foodImage.className = "food-illustration";
    foodImage.alt = "";
    foodImage.width = 160;
    foodImage.height = 160;
    foodImage.decoding = "async";
    foodImage.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(restaurantPlateSvg(r.cuisine));
    // Inline styling also works when older GitHub Pages CSS is cached.
    Object.assign(foodImage.style, { position: "relative", zIndex: "5", width: "160px", height: "160px", maxWidth: "95%", objectFit: "contain", display: "block" });
    art.append(foodImage);
    art.setAttribute("aria-hidden", "true");
    const content = document.createElement("div"); content.className = "content";
    const meta = document.createElement("div"); meta.className = "meta";
    meta.textContent = `${r.cuisine} · ${r.price == null ? "Price not verified" : `Historic price ${r.price}/5`} · ${r.rating == null ? "Rating not verified" : `Historic rating ★ ${r.rating}/5`}`;
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

# PLATE. 🍽️

### Good food. Less searching.

**PLATE** is an interactive restaurant discovery application that helps users find places to eat in Greensboro, North Carolina, based on their cuisine preferences, price range, and ratings.

Originally developed as a Python command-line recommendation program during my freshman year, PLATE has evolved into a full-stack web application featuring a redesigned interface, animated dining experiences, and a cloud-hosted Python recommendation API.

**[🌐 Launch PLATE](https://khefney.github.io/Recommendation-Program/)**

---

## The Experience

PLATE transforms a simple restaurant search into an interactive dining experience.

The application features a cinematic entrance with animated plates, cuisine-specific visual themes, and an editorial-inspired interface. Selecting different cuisines changes the atmosphere of the website while dynamically updating restaurant recommendations.

### Features

* **Personalized recommendations:** Discover restaurants based on cuisine, price level, and minimum rating.
* **Cuisine discovery:** Explore dining options across a variety of cuisines.
* **Interactive animations:** Experience a cinematic plate entrance, animated restaurant cards, and cuisine-specific transitions.
* **Restaurant search:** Find restaurants by name.
* **Saved favorites:** Save restaurants you want to revisit.
* **Restaurant information:** Browse restaurant names, cuisine categories, addresses, and available ratings and price levels.
* **Responsive design:** Explore PLATE on desktop and mobile devices.

---

## Tech Stack

| Layer            | Technology                      |
| ---------------- | ------------------------------- |
| Frontend         | HTML5, CSS3, JavaScript         |
| Backend          | Python                          |
| API Framework    | FastAPI                         |
| Frontend Hosting | GitHub Pages                    |
| Backend Hosting  | Cloudflare Workers              |
| Data             | Python-based restaurant dataset |
| Version Control  | Git & GitHub                    |

---

## How It Works

PLATE uses a decoupled frontend and backend architecture.

**1. User interaction**

Users select their preferred cuisine, price level, and minimum rating through the web interface.

**2. API request**

JavaScript sends the selected preferences to the Python recommendation API hosted on Cloudflare Workers.

**3. Recommendation processing**

The Python recommendation engine filters the restaurant dataset against the user's preferences.

**4. Dynamic results**

The API returns matching restaurants as JSON, and JavaScript renders the results as interactive restaurant cards.

This architecture separates the presentation layer from the recommendation logic, allowing the interface and backend to evolve independently.

---

## Project Evolution

### Version 1 — The Original Python Program

The project began as a freshman-year Python application that used terminal input to guide users through restaurant recommendations.

Users entered the beginning of a cuisine name, narrowed their selection, and received matching restaurant information.

The original implementation introduced me to fundamental programming concepts such as conditional logic, iteration, lists, string manipulation, and user input.

### Version 2 — PLATE

I revisited the project to transform it into a modern web application while preserving its original recommendation logic.

The revamp introduced:

* A responsive, interactive frontend.
* A reusable Python recommendation engine.
* A REST API for communication between the frontend and backend.
* Cloud deployment using Cloudflare Workers.
* Expanded restaurant data and improved data handling.
* Animated cuisine themes and a redesigned user experience.

This project represents my progression from learning Python fundamentals to designing, developing, and deploying a full-stack application.

---

## Running Locally

### Prerequisites

* Python
* Git
* [uv](https://docs.astral.sh/uv/)

### 1. Clone the repository

```bash
git clone https://github.com/Khefney/Recommendation-Program.git
cd Recommendation-Program
```

### 2. Start the Python API

```bash
uv run pywrangler dev
```

The API should be available at:

```text
http://localhost:8787
```

### 3. Configure the frontend

Update `config.js` to point to your local API:

```javascript
window.PLATE_API_BASE = "http://localhost:8787";
```

### 4. Start the frontend

Open a separate terminal and run:

```bash
python -m http.server 5500
```

Visit:

```text
http://localhost:5500
```

The frontend should now communicate with your locally running Python API.

---

## API

The Python backend exposes endpoints for retrieving cuisine categories and restaurant recommendations.

| Endpoint                   | Description                                        |
| -------------------------- | -------------------------------------------------- |
| `GET /api/health`          | Check API availability                             |
| `GET /api/cuisines`        | Retrieve available cuisine categories              |
| `GET /api/recommendations` | Retrieve restaurants matching selected preferences |

Example request:

```http
GET /api/recommendations?cuisine=ital&min_rating=4
```

The API returns restaurant information in JSON format for the frontend to display.

---

## Restaurant Data

PLATE currently focuses on restaurants in Greensboro, North Carolina.

The dataset includes restaurant names, cuisine categories, addresses, and available rating and price information.

Restaurant information is maintained as a project dataset rather than retrieved from a live restaurant service. Historical ratings and price levels may not reflect current customer reviews, menus, or operating conditions.

---

## Future Improvements

PLATE is an evolving personal project. Potential future enhancements include:

* Live restaurant data integration.
* Map-based restaurant discovery.
* More advanced personalized recommendations.
* Improved restaurant photography and visual previews.
* Additional cities and location-based discovery.
* Enhanced accessibility and animation preferences.

---

## About the Developer

**Kirsten Hefney**

Computer Science | North Carolina A&T State University

PLATE began as one of my early programming projects and became an opportunity to revisit my original work with the software engineering skills I've developed since then.

Rather than abandoning the original project, I wanted to build upon it and demonstrate how a simple idea can evolve into a complete application.

**[View My GitHub](https://github.com/Khefney)**

---

© 2026 Kirsten Hefney. Built with Python, JavaScript, and a love for good food.


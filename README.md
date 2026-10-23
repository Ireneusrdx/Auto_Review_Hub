# Auto Review Hub

A full-stack car dealership review application: browse dealerships across the
US, filter by state, read customer reviews with sentiment analysis, and post
your own review as a registered user.

Built as the IBM Full Stack Application Development Capstone Project.

## What it does

- **Dealerships**: list all dealerships, filter by state, view dealer details
- **Reviews**: per-dealer reviews, each scored positive / negative / neutral
  by a sentiment analyzer service
- **Post a review**: registered users submit reviews (car make, model, year,
  purchase date) which are stored and shown with their sentiment
- **User management**: register, log in, log out (Django session auth),
  Django Admin with a superuser for managing car makes and models
- **Static pages**: Home, About, Contact

## Architecture

```
React frontend (built, served by Django)
        |
        v
Django app  /djangoapp/*  (auth, admin, car data, proxy layer)
   |                |
   v                v
Express service   Sentiment analyzer
:3030             Flask + NLTK VADER
   |
   v
MongoDB (dealershipsDB: dealers + reviews)
```

- `server/` — Django project (`djangoproj`) and app (`djangoapp`)
- `server/frontend/` — React app (dealers, dealer details, post review,
  login, register)
- `server/database/` — Express + Mongoose service over MongoDB, seeded from
  `server/database/data/` (50 dealerships and their reviews)
- `server/djangoapp/microservices/` — Flask sentiment analyzer (VADER);
  designed for IBM Code Engine, runs anywhere as a container
- `server/deployment.yaml`, `server/service.yaml` — Kubernetes manifests
  for the Django app

Django's own database (SQLite) holds only users and car makes/models.
Dealers and reviews live in MongoDB and are reached through Django's proxy
layer (`server/djangoapp/restapis.py`).

## Run it locally

Prerequisites: Python 3.12, Node.js 18+, Docker (for MongoDB + Express) or a
MongoDB connection string.

```bash
# 1. MongoDB + Express service (seeds itself on first start)
cd server/database
docker compose up -d        # MongoDB on :27017, Express API on :3030

# 2. Sentiment analyzer (terminal 2)
cd server/djangoapp/microservices
pip install -r requirements.txt
python app.py               # http://localhost:5050

# 3. Django (terminal 3)
cd server
pip install -r requirements.txt
cp djangoapp/.env.example djangoapp/.env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver  # http://localhost:8000

# 4. Frontend build (Django serves it)
cd server/frontend
npm install
npm run build
```

Then open http://localhost:8000 — the dealers list is the home page.

Without Docker, run Express directly against any MongoDB:
`MONGO_URL=mongodb://127.0.0.1:27017/ node server/database/app.js`

## Configuration

Django reads service locations from `server/djangoapp/.env`
(see `.env.example`): `backend_url` (Express) and `sentiment_analyzer_url`.
Deployment settings come from environment variables: `DJANGO_SECRET_KEY`,
`DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS`, `DJANGO_CSRF_TRUSTED_ORIGINS`, and
`DJANGO_SUPERUSER_*` for non-interactive admin creation (used by the Docker
entrypoint).

## CI/CD

GitHub Actions:
- **Lint Code** (`.github/workflows/lint.yml`): flake8 for Python, jshint
  for the Express service
- **CI — Build and Test** (`.github/workflows/ci.yml`): builds the React
  app, runs Django checks, migrations and tests, syntax-checks Express

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md). The short version: this is a
server-side application (Django + Node + MongoDB) and is deployed with the
included Render Blueprint (`render.yaml`). It is **not** deployed to GitHub
Pages — Pages serves static files only and cannot run any of the backend
services this app is built on.

# UpayaNode

Anonymous identity and community feed (passphrase-based auth, problem/solve posts).

## Project structure (container-ready)

```
UpayaNode/
├── docker-compose.yml    # Web + Redis
├── Dockerfile           # Django app image
├── .dockerignore
├── .env.example         # Copy to .env and set values
├── requirements.txt
├── README.md
└── upayanode/           # Django project (self-contained)
    ├── manage.py
    ├── entrypoint.sh    # migrate + collectstatic + exec CMD
    ├── core/            # Main app (auth, feed, posts, solves)
    ├── templates/
    ├── static/          # CSS, JS
    ├── media/           # User uploads (created at runtime)
    ├── staticfiles/     # collectstatic output (created at runtime)
    └── upayanode/       # Project config
        ├── settings.py
        ├── urls.py
        ├── wsgi.py
        └── asgi.py
```

## Run with Docker

1. Copy env: `cp .env.example .env` and set `SECRET_KEY`, `ALLOWED_HOSTS`, etc.
2. Build and run: `docker-compose up -d`
3. App: http://localhost:8000 | Redis: localhost:6379

## Run locally (no Docker)

1. Create a venv and install: `pip install -r requirements.txt`
2. Optional: install Redis for cache; or cache will fall back (if configured).
3. From `upayanode/`: `python manage.py migrate` then `python manage.py runserver`

## Environment (production)

| Variable        | Description                    |
|----------------|--------------------------------|
| SECRET_KEY     | Django secret (required)       |
| DEBUG          | 0 in production                |
| ALLOWED_HOSTS  | Comma-separated hosts          |
| REDIS_URL      | e.g. redis://redis:6379/1      |
| DATABASE_URL   | Optional PostgreSQL URL        |

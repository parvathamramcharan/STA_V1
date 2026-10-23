# Docker setup

Run the frontend, FastAPI backend, Redis, and Celery worker together using the
single Compose file at the project root. Elasticsearch is not started by
Compose; the backend connects to the existing server at `192.168.10.200:9200`.
Keycloak and Ceph are not included.

## Configure environment

The Compose file loads `backend/.env` and `frontend/.env` directly. Keep the
existing files and credentials; do not overwrite them with the example
templates. The backend `.env` must contain the admin/user credentials and
Elasticsearch settings. Set the same random `JWT_SECRET` in both `.env` files;
it must be at least 32 bytes. Keep both files private and do not commit them.

Access tokens are valid for one hour by default (`JWT_EXPIRY_SECONDS=3600` in
`backend/.env`). Refresh-token lifetime is configured separately with
`JWT_REFRESH_EXPIRY_SECONDS`.

Set `ELASTIC_USER` and `ELASTIC_PASSWORD` in `backend/.env` if the remote
Elasticsearch server requires basic authentication. Alternatively, set
`ES_API_KEY`. Configure `ES_HOST` if the server address differs.

## Start the services

From the project root, build and start everything:

```sh
docker compose up --build -d
```

The frontend is available on port 80 and the backend API on port 5000. If those
host ports are already in use, change the published ports in the root
`docker-compose.yml`. The frontend contacts the API using its Compose service
name (`api`), so `BACKEND_URL` in `frontend/.env` is overridden inside Docker.

Named Docker volumes preserve JWT revocations and queued PDF files across
container restarts. The Compose file reuses the existing
`backend_token-revocations` and `backend_pdf-jobs` volumes; if this is a fresh
installation without those volumes, create them with `docker volume create
backend_token-revocations` and `docker volume create backend_pdf-jobs` first.
Elasticsearch data remains on the existing remote server.

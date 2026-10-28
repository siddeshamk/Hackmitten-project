# SignalRoot local deployment

This package adds a Docker Compose path for running the SignalRoot React dashboard, ShopSphere storefront, FastAPI backend, SQLite persistence, and OpenTelemetry Collector together. It is intended for a local demo or trusted development environment, not direct public internet exposure.

## Prerequisites

- Docker Desktop installed and running (Windows/macOS) or Docker Engine + Compose plugin (Linux).
- At least 4 GB RAM recommended for image builds.

## Start the full stack

From this directory (the folder containing `docker-compose.yml`):

```powershell
docker compose up --build -d
```

Open:

- SignalRoot dashboard: http://127.0.0.1:8080
- ShopSphere storefront: http://127.0.0.1:8081
- API docs: http://127.0.0.1:8080/docs
- Health: http://127.0.0.1:8080/api/health
- OTLP/HTTP receiver: http://127.0.0.1:4318 (send OTLP requests to `/v1/traces`, `/v1/metrics`, or `/v1/logs`)

SQLite is stored in the named Docker volume `signalroot-data`, so restarting/recreating containers does not normally erase incidents. To inspect logs:

```powershell
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f otel-collector
```

To stop the stack while preserving SQLite data:

```powershell
docker compose down
```

To remove the stack and its stored demo data permanently:

```powershell
docker compose down -v
```

## Validate after startup

```powershell
Invoke-RestMethod http://127.0.0.1:8080/api/health
Invoke-RestMethod http://127.0.0.1:8080/api/scenarios
```

Then open the app, create an incident in Fault Injection Lab, and inspect Root Cause Analysis, Incident Timeline, Service Dependency Map, Diagnostic Tests, and the verification report.

## Local development without Docker

Backend terminal:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Frontend terminal:

```powershell
cd frontend
npm install
npm run dev
```

For backend tests:

```powershell
cd backend
pip install -r requirements-dev.txt
python -m pytest -q
```

## Troubleshooting

- **Port 8080 is occupied:** change the left side of `"127.0.0.1:8080:80"` in `docker-compose.yml` to another local port such as `8081:80`.
- **Backend unhealthy:** inspect `docker compose logs backend`; confirm the container can initialize SQLite under `/data`.
- **Frontend returns 502:** wait for backend health, then inspect `docker compose logs frontend backend`.
- **Collector export errors during startup:** first verify the app health endpoint. The collector may log transient connection errors while the backend starts.
- **Ollama assistant fallback:** Ollama is optional. If running Ollama on the host, the compose environment points to `host.docker.internal:11434`; otherwise the API uses its evidence-summary fallback.

## Security boundary

The frontend and OTLP ports are bound to loopback in Compose. Keep them local unless you add authentication, TLS, request-size and rate limits, secret management, access control, data retention policies, and a security review. This demo includes simulated remediation; it must not be treated as a production change-management system.

## Automated validation and quick start

### Quick start on Windows without Docker

From the extracted project root, run:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\START-HERE-WINDOWS.ps1
```

This opens two PowerShell windows and installs the Python and npm dependencies. For manual startup, use the commands in the sections above.

### Backend smoke test

With the API already running, open another PowerShell terminal:

```powershell
cd backend
python smoke_test.py
```

If using the Docker Compose stack, use:

```powershell
python smoke_test.py --base-url http://127.0.0.1:8080
```

The smoke test creates a demo incident and verification record but does not clear existing data.

### Automated tests and CI

Backend tests:

```powershell
cd backend
pip install -r requirements-dev.txt
python -m pytest -q
```

Frontend production build:

```powershell
cd frontend
npm install
npm run build
```

A GitHub Actions workflow at `.github/workflows/ci.yml` runs backend tests and the frontend production build on pushes and pull requests. The frontend job requires network access to install npm dependencies.

## Public hosting is not enabled by this package

The included Compose stack is deliberately bound to localhost. Do not expose it directly to the public internet. Before public hosting, add authentication/authorization, HTTPS, secrets management, rate limiting, request and OTLP payload limits, log/trace redaction, retention controls, and a persistent production database. SQLite in a container volume is suitable for a single-node demo, not a multi-instance hosted service. Actual deployment to a hosting account requires the owner's account access, chosen host, and environment configuration; no external service has been deployed by generating this package.


## ShopSphere incident handoff

With Docker running, open `http://127.0.0.1:8081`, search for `wireless headphones`, and submit. The ShopSphere backend route intentionally returns a simulated HTTP 504 after persisting the incident and linked telemetry. The SignalRoot AI assistant popup then offers an **Investigate in SignalRoot** action, which redirects to the incident-specific Root Cause Analysis page at port 8080.

For local development, run the backend on port 8000, SignalRoot Vite app on port 5173, and ShopSphere Vite app on port 5174. `START-HERE-WINDOWS.ps1` launches all three.

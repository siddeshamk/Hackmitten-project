# Incident Intelligence Platform

## ShopSphere → SignalRoot live demo flow

The repository includes a second storefront app, **ShopSphere**, that intentionally triggers a controlled search-timeout scenario and hands the recorded incident to SignalRoot. This is an isolated local demo; it does not affect external services.

### Local development (three terminals, or use the Windows launcher)

1. Start FastAPI from `backend` on port `8000`.
2. Start the existing SignalRoot frontend from `frontend` on port `5173`.
3. Start ShopSphere from `shopsphere` on port `5174`.

On Windows PowerShell, from the project root you can launch all three using:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\START-HERE-WINDOWS.ps1
```

Open **ShopSphere** at `http://127.0.0.1:5174`. The search box defaults to `wireless headphones`. Submit a search to trigger the controlled `504 Gateway Timeout`. The backend creates an `INC-...` incident, stores request/trace identifiers and evidence, and records correlated telemetry for ShopSphere Web → API Gateway → Inventory Service. The SignalRoot assistant modal appears only when the backend returns a confirmed incident. It asynchronously calls `/api/assistant/investigate` to show an initial evidence-grounded summary (local Ollama when available, deterministic evidence fallback otherwise). Click **Investigate in SignalRoot** to open `http://127.0.0.1:5173/?incidentId=...&source=shopsphere`; SignalRoot loads that incident and opens Root Cause Analysis.

### ShopSphere API contract

- `POST /api/shopsphere/search` with `{"query":"wireless headphones","scenario":"timeout"}`
- The endpoint intentionally responds with HTTP `504` and JSON fields `failure_code`, `request_id`, `trace_id`, `incident`, and `investigation_url`. The 504 is the simulated user-facing failure; incident/evidence creation is successful and persisted before the response is returned.
- Invalid search input returns `422`; if the backend is unreachable, ShopSphere shows a connection error and does not pretend an incident was created.

### Docker Compose

Run `docker compose up --build -d` from the project root. Open SignalRoot at `http://127.0.0.1:8080` and ShopSphere at `http://127.0.0.1:8081`. The ShopSphere image is built with its SignalRoot redirect URL set to port `8080`.

A runnable local prototype for an AI-Ops / SRE incident investigation workflow. It includes a sample web application, safe fault simulations, evidence collection, incident timeline, evidence-backed root-cause hypotheses, and engineer-controlled fix/replay.

## Deployment-ready local stack

A Docker Compose deployment path is included. For the quickest full-stack startup, use [DEPLOYMENT.md](DEPLOYMENT.md) and run `docker compose up --build -d` from the project root. SignalRoot is served at `http://127.0.0.1:8080`, ShopSphere at `http://127.0.0.1:8081`, and the API docs at `http://127.0.0.1:8080/docs`. The stack uses a named volume for SQLite persistence. This is for local/trusted demo use, not direct public internet deployment.

Frontend dependencies are pinned in `frontend/package.json` to reduce unexpected version drift. The Docker image builds the React app during image creation; this environment could not complete `npm install`, so the React production build must still be confirmed in a network-enabled environment.

## Stack
- Frontend: React + Vite
- Backend: FastAPI
- Persistence: SQLite (created automatically)
- Telemetry: structured simulated logs, metrics, traces, and change events

## Safety and scope
This project only simulates failures inside its own local demo environment. It does not crash real databases, modify real networks, make real payments, or inject faults into production. Root-cause rankings are deterministic evidence-based demo rules, not a claim of autonomous production-grade diagnosis. AI provider integration is not required to run it.

## Requirements
- Python 3.10+
- Node.js 18+

## Run the backend (Windows PowerShell)
```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
API docs: http://127.0.0.1:8000/docs

## Run the frontend (second terminal)
```powershell
cd frontend
npm install
npm run dev
```
Open the URL printed by Vite (usually http://127.0.0.1:5173).

## Demo flow
1. Open **Application Playground** and test the simulated app.
2. Open **Fault Injection Lab**, choose a scenario, and click **Inject fault**.
3. Watch service health and the evidence stream change.
4. Open **Investigate incident** to inspect timeline, evidence, and ranked hypotheses.
5. Click **Apply demo fix** to apply a safe simulated correction.
6. Click **Replay scenario** to verify whether the original symptom returns.
7. Use **Reset lab** to restore the baseline.

## Included scenarios
- Database connection pool exhaustion
- Application exception
- Network latency / timeout
- Message queue backlog
- Bad configuration / deployment
- Authentication/session configuration issue
- Duplicate username validation conflict
- Downstream microservice unavailable

## API overview
- `GET /api/health`
- `GET /api/dashboard`
- `GET /api/scenarios`
- `POST /api/incidents/inject`
- `GET /api/incidents`
- `GET /api/incidents/{incident_id}`
- `POST /api/incidents/{incident_id}/apply-fix`
- `POST /api/incidents/{incident_id}/replay`
- `POST /api/lab/reset`
- `POST /api/playground/register`
- `POST /api/playground/login`
- `GET /api/playground/data`

## Notes
- Simulated auto-recovery can be enabled or disabled for each scenario.
- A recovered incident remains stored so engineers can investigate the original evidence.
- Fixes are deliberately separate from investigation. Investigation does not modify the system.

## Stage 6 — Native OpenTelemetry (OTLP)

The API now exposes OTLP/HTTP **protobuf** receivers for traces, metrics, and logs at `/v1/traces`, `/v1/metrics`, and `/v1/logs`. These are intended to receive telemetry from an OpenTelemetry Collector; the receiver converts incoming records into the same SQLite telemetry explorer. API request tracing and OTLP metric export are enabled when `OTEL_EXPORTER_OTLP_ENDPOINT` is configured. The app remains runnable without a collector.

### Start the collector (Windows, Docker Desktop required)

1. Start the FastAPI backend in one terminal as above.
2. From the project root, start the collector:

   ```powershell
   docker compose -f docker-compose.otel.yml up -d
   ```

3. In a separate PowerShell terminal, set the backend exporter variables and restart the backend:

   ```powershell
   $env:OTEL_EXPORTER_OTLP_ENDPOINT = "http://127.0.0.1:4318"
   $env:OTEL_SERVICE_NAME = "incident-intelligence-api"
   uvicorn app.main:app --reload --port 8000
   ```

   Run those commands from `backend` with its virtual environment activated. For services running in Docker, configure their OTLP exporter to send to `http://host.docker.internal:4318` (or the collector's service name if they share a Docker network). For non-Docker local services, use `http://127.0.0.1:4318`.

4. Make requests to the API, then open **Telemetry Explorer** and refresh. Incoming collector records appear with source `opentelemetry-otlp`. You can also inspect collector output with `docker compose -f docker-compose.otel.yml logs -f`.
5. Stop the collector with `docker compose -f docker-compose.otel.yml down`.

### Receiver endpoints

- `POST /v1/traces` — OTLP/HTTP protobuf trace export
- `POST /v1/metrics` — OTLP/HTTP protobuf metric export
- `POST /v1/logs` — OTLP/HTTP protobuf log export

The receiver is a local development integration, not an authenticated internet-facing observability gateway. Keep it bound to a trusted development environment, and add authentication, request limits, retention controls, and network restrictions before adapting it for shared or production use. Collector-to-backend connectivity is configured for Docker Desktop on Windows using `host.docker.internal`.

## Stage 7 — Cross-service incident correlation

Stage 7 adds an explainable correlation layer for the investigation workspace:

- `GET /api/incidents/{incident_id}/correlation?window_minutes=30` correlates telemetry using shared trace IDs first, then a bounded time window plus affected service, and finally error/critical signals inside the time window.
- The Root Cause Analysis page displays correlated telemetry, trace groups, involved services, and error counts.
- Root cause ranking now consumes incident-correlated telemetry instead of indiscriminately scoring the latest 200 telemetry records.
- Recurrence matching now includes same-scenario matches and a transparent symptom/root-cause word-overlap score.
- API responses explicitly describe limitations; time proximity is weaker evidence than a shared trace ID, and heuristic scores are not calibrated probabilities.

### Quick verification

With the backend running, open `http://127.0.0.1:8000/docs`. Inject a fault, ingest two telemetry records with the same `trace_id` for different services, then call the incident's `/correlation` endpoint. The response should group records by trace ID and list the involved services. The frontend's Root Cause Analysis page also displays this information.

Example telemetry payload for `POST /api/telemetry/ingest`:

```json
{
  "source": "manual-demo",
  "signal_type": "trace",
  "service_name": "Inventory Service",
  "severity": "error",
  "message": "Downstream request timed out",
  "trace_id": "demo-trace-001",
  "attributes": {"trace_id": "demo-trace-001", "http.route": "/api/items"}
}
```

### Stage 7 limitations

This is an explainable local demo, not a production AIOps diagnosis engine. Time-window matching can include unrelated events; text overlap is not semantic similarity; the correlation engine does not prove causality. For stronger results, instrument all services, propagate trace context end-to-end, and add span parent/child IDs, deployment/change records, service dependency maps, and reviewed regression tests. The UI bundle was not built in this environment; run `npm install` and `npm run build` inside `frontend` to verify locally.

## Stage 8 — Change-aware investigations and distributed trace demo

Stage 8 adds a local change-event registry and a generated multi-service trace chain:

- `POST /api/changes` records a deployment, configuration, feature-flag, rollback, or dependency change.
- `GET /api/changes?limit=100` lists recorded change events.
- `POST /api/demo/distributed-request?fail_service=Inventory%20Service` creates demo spans for Web App → API Gateway → Inventory Service → Database, sharing one trace ID and recording span IDs. Set `fail_service` to `API Gateway`, `Inventory Service`, or `Database`; omit it or pass an empty value for a successful chain.
- `GET /api/incidents/{incident_id}/correlation` now returns `related_changes` alongside correlated telemetry and trace groups.

The frontend includes a **Change Events** page to record changes and generate a distributed trace, and the Root Cause Analysis view displays related changes. Change timing is contextual evidence only; it does not prove causality. The distributed trace demo creates local synthetic spans/records; it does not call real downstream services.

### Test Stage 8

1. Start the backend and frontend using the Stage 7 run instructions.
2. Open **Change Events** and record a configuration or deployment event for `Inventory Service`.
3. Click **Run distributed trace demo** and choose `Inventory Service` as the simulated failing service.
4. Check **Telemetry Explorer** for the shared trace ID and error record.
5. Create an incident from **Fault Injection Lab**, then open **Root Cause Analysis** to inspect correlated telemetry and any changes near the incident timestamp. For change matching, event time and incident time must fall within the selected correlation window.
6. API documentation is available at `http://127.0.0.1:8000/docs`.

This remains a local demo: heuristic correlation and time proximity are not causal proof, and change events are manually entered unless an external deployment system is configured to send them.

## Stage 9 — AI Investigation Assistant

The new **AI Investigation Assistant** page lets an engineer ask evidence-focused questions about a selected incident. It assembles the incident's recorded evidence, correlated telemetry, and related change events, then sends that limited evidence pack to a local Ollama model if available.

### Optional local model setup

1. Install and start Ollama from its official installer.
2. In a terminal, download a model, for example:

   ```powershell
   ollama pull llama3.2
   ```

3. Before starting FastAPI, configure the local model (defaults shown):

   ```powershell
   $env:OLLAMA_BASE_URL = "http://127.0.0.1:11434"
   $env:OLLAMA_MODEL = "llama3.2"
   uvicorn app.main:app --reload --port 8000
   ```

The assistant uses Ollama's local `/api/chat` endpoint. If Ollama is not installed or running, the endpoint returns a deterministic evidence summary instead; it labels that response as a fallback, not as an AI diagnosis.

### Assistant endpoint

`POST /api/assistant/investigate`

Example JSON body:

```json
{
  "incident_id": "INC-REPLACE_WITH_REAL_ID",
  "question": "Which evidence supports the leading hypothesis, and what should I test next?"
}
```

The assistant is read-only and cannot apply fixes. AI output is advisory; verify statements against raw evidence. The demo does not establish causation from temporal proximity alone and should not be connected to production systems without authentication, access controls, redaction, rate limiting, and appropriate security review.

## Stage 10 — Diagnostic tests and verification history

Stage 10 adds a safe, rule-based diagnostic test workflow to the local demo:

- `GET /api/incidents/{incident_id}/diagnostic-tests` returns scenario-specific checks and recent diagnostic runs.
- `POST /api/incidents/{incident_id}/run-diagnostics` evaluates evidence and simulated fix/replay state, then persists the run.
- `GET /api/incidents/{incident_id}/verification-history` returns the most recent persisted diagnostic runs.
- The React sidebar includes **Diagnostic Tests**, where engineers can choose an incident, run checks, review warnings/blocked checks, and follow the apply-fix → replay → rerun sequence.

**Important limitation:** These checks are deterministic rules over the demo's incident records. They do not execute arbitrary tests against application code, do not probe production services, and cannot prove a production fix. Some initial evidence is seeded by the fault simulator. A nearby change or keyword match is a lead, not proof of causality. Use a real isolated test environment before treating a fix as verified outside this prototype.

### Stage 10 quick test

1. Start the backend and frontend as described above.
2. In Fault Injection Lab, create a scenario such as Database connection pool exhaustion.
3. Open Diagnostic Tests and select that incident.
4. Click **Run diagnostic checks**. Review the pass, warning, and blocked statuses.
5. Open Root Cause Analysis and apply the lab-only fix, then replay the scenario.
6. Return to Diagnostic Tests and run the checks again. The regression check reflects the latest recorded replay; the other checks inspect the recorded evidence and recommendation.
7. Inspect `/docs` for the new endpoints or query `GET /api/incidents/{incident_id}/verification-history`.


## Stage 11 — Real local HTTP regression checks

The Diagnostic Tests page now includes **Run local HTTP tests**. This sends actual HTTP requests to a fixed allowlist of loopback-only demo API routes and checks: health status, data response schema, unique registration, login after registration, and safe duplicate-registration rejection. Each run is persisted in the existing SQLite verification table.

API endpoints:
- `POST /api/regression/http-checks` — execute the local HTTP suite.
- `GET /api/regression/http-history` — list saved HTTP regression reports.

The runner does not accept arbitrary URLs and only targets `http://127.0.0.1:8000` by default. If changing `REGRESSION_BASE_URL`, it must remain an HTTP loopback URL. Start the FastAPI server before running the checks. These are real HTTP checks against the local demo application, not production tests.


## Stage 12 — Before-and-after regression comparison

Stage 12 adds persistent snapshots and a comparison report for the same allowlisted local HTTP regression suite.

1. Open **Diagnostic Tests** and click **Capture baseline** before applying a change. The baseline records the current outcome of each named assertion.
2. Apply or simulate the change/fix in the local demo.
3. Click **Run after-change comparison**. The runner repeats the same HTTP checks and compares named test outcomes.
4. Review `stable`, `regression`, `improved`, `still-failing`, and `inconclusive` results. A baseline that already contains failures is allowed; the report does not label a failing baseline as healthy.

API endpoints:
- `POST /api/regression/baseline` — run the local HTTP suite and save a baseline snapshot.
- `POST /api/regression/compare` — run the suite again and compare it with the newest baseline.
- `GET /api/regression/snapshots` — list stored snapshots and reports.
- `GET /api/regression/compare/latest` — retrieve the latest comparison report.

Snapshots are stored in SQLite and cleared by **Reset lab**. The comparison checks named assertion pass/fail status and HTTP status codes, not full response-body diffs. These checks only target allowlisted loopback demo endpoints; they do not verify production systems or prove causality. Baseline and comparison runs create temporary demo usernames.


## Stage 13 — Incident-specific verification report

Stage 13 adds a unified verification report that links a selected incident to its current fix/replay state, scenario-specific diagnostic checks, a fresh run of the allowlisted local HTTP regression suite, a snapshot of incident evidence, fix history, and (when available) the latest global before/after comparison.

New endpoints:
- `POST /api/incidents/{incident_id}/verify-regression` — execute targeted diagnostics and local HTTP checks, then persist a combined incident verification report.
- `GET /api/incidents/{incident_id}/verification-report` — retrieve the latest report for that incident.

In the **Diagnostic Tests** page, select an incident and use **Generate incident verification report**. The report status is deliberately cautious: it can report `fix-not-applied`, `replay-not-passed`, `regression-detected`, `http-checks-failed`, `needs-review`, or `verified-in-demo`.

Important limitations: the targeted diagnostic checks are deterministic rules over demo state. The local HTTP suite tests allowlisted demo endpoints and is not a production service test. The latest before/after comparison is global and may not be associated with this incident's fix. A `verified-in-demo` result is not a production guarantee and does not prove root-cause causality.


## Stage 14 — Incident timeline

The Incident Timeline page combines the incident's own timeline and evidence with correlated telemetry, nearby change events, and recorded remediation/replay state. Each item includes a source label and correlation-strength caveat. The timeline is chronological, not a causal proof.

Endpoint: `GET /api/incidents/{incident_id}/timeline?window_minutes=30`

Open the React app, choose **Incident Timeline**, and select an incident. Use the Root Cause Analysis page to continue the investigation.


## Stage 15 — Service dependency map and failure propagation

This stage adds a Service Dependency Map page and `GET /api/dependencies`. It combines the documented local demo topology (explicitly labeled `configured`) with edges inferred from stored telemetry carrying `trace_id`, `span_id`, and `parent_span_id` attributes (labeled `observed`). It summarizes error signals by service and lists earliest recorded errors as investigation leads.

### Test Stage 15
1. Start the backend and frontend using the commands above.
2. Open **Change Events** and run the distributed trace demo, optionally selecting a failing service.
3. Open **Service Dependency Map** and select the relevant incident, or choose all stored telemetry.
4. Review observed span relationships, error signals, and propagation leads.
5. Open **Incident Timeline** to compare the event order.

API: `GET /api/dependencies` or `GET /api/dependencies?incident_id=INC-...&window_minutes=30`.

**Limitations:** configured topology is a demo reference, not service discovery. Observed edges require parent/child span identifiers. The earliest recorded error is not automatically the root cause; missing telemetry and clock skew can change apparent order.

## Stage 16 — Impact analysis and estimated blast radius

The Service Dependency Map now includes an **Estimated blast radius** panel. It starts from the selected incident's failing service and walks the caller-to-dependency graph in reverse to estimate which upstream services might be affected. The result includes potential impacted services, dependency depth, error telemetry counts, observed-vs-configured relationship basis, and explicit limitations.

### Impact API

- `GET /api/impact` — estimate blast radius from available telemetry, selecting the strongest error signal when possible.
- `GET /api/impact?incident_id=INCIDENT_ID` — estimate impact for a selected incident.
- `GET /api/impact?service=Inventory%20Service` — estimate impact starting from a specific service.

**Interpretation:** impact level is a heuristic indicator, not a measured SLO or customer-impact calculation. Configured demo topology suggests possible dependency; only observed telemetry supports an observed relationship. The endpoint does not estimate customer counts or claim production impact.

## Consolidated demo workflow

The current package includes the existing incident investigation workflow in one project: safe fault injection, structured telemetry and optional OTLP collection, incident correlation and timelines, change events, dependency mapping, evidence-grounded assistant (optional local Ollama), diagnostics, local HTTP regression tests, before/after comparison, incident verification reports, and impact estimation.

For a short demo: **Inject fault → open Dependency Map → review Estimated blast radius → investigate Root Cause Analysis → run Diagnostic Tests → apply demo fix → replay → generate verification report.**


## Frontend integration and backend verification

The Vite development server proxies `/api/*` requests to `http://127.0.0.1:8000`, so the React application uses a relative `/api` base URL instead of hard-coding the backend address in the browser. Keep the backend running on port 8000 while using the frontend.

### Run backend API tests

From the `backend` folder in PowerShell, activate the virtual environment and run:

```powershell
pip install -r requirements-dev.txt
python -m pytest -q
```

Tests use a separate temporary SQLite database and cover the health/dashboard/scenario contract, incident investigation and verification, telemetry and trace correlation, change events, ShopSphere timeout incident creation, AI assistant fallback, and regression workflows. They do not clear the user's normal demo database.

### Validate the frontend

From the `frontend` folder, run:

```powershell
npm install
npm run build
```

The JSX syntax was checked in the packaging environment. A full Vite production build could not be completed there because dependency installation timed out; verify the build on the local Windows machine.

## Final release helpers

- `START-HERE-WINDOWS.ps1` opens backend, SignalRoot frontend, and ShopSphere terminals for local development.
- `backend/smoke_test.py` runs 10 live API smoke checks against a running server and preserves existing data.
- `.github/workflows/ci.yml` runs backend tests and the frontend production build on GitHub Actions.
- `DEPLOYMENT.md` covers Docker Compose, local startup, smoke tests, CI, and security boundaries.
- `shopsphere/` contains the second demo website that creates a real local incident record and hands it to SignalRoot.

For the quickest local run on Windows, extract the ZIP, open PowerShell in the project root, and run:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\START-HERE-WINDOWS.ps1
```

Then open `http://localhost:5173`. To run the full container stack instead, follow `DEPLOYMENT.md` and use `docker compose up --build -d`.

## ShopSphere multi-scenario failure demo

ShopSphere presents a normal storefront without a failure-scenario chooser. Submitting a product search triggers the configured network-timeout demo at the product-search operation. Other failure scenarios remain available through the SignalRoot Fault Injection Lab and backend scenario endpoints. The backend records an incident, evidence, request ID, trace ID, and linked telemetry, then returns a controlled scenario-specific HTTP status. The SignalRoot assistant popup appears when the response includes the created incident and the **Investigate in SignalRoot** button deep-links to that incident.

Scenario HTTP status mapping: database pool 503, application exception 500, network timeout 504, queue backlog 503, bad configuration 503, authentication/session 401, duplicate username 409, and downstream service unavailable 503. These are simulated responses for a local demo, not real infrastructure faults.


## ShopSphere failure locations (context-aware demo)

The ShopSphere scenario lab now includes a **Failure location** selector. Select a failure scenario, then choose the relevant user-facing operation. The chosen operation is sent to the FastAPI backend and recorded as `user_action` and `target_area` on the incident and its trace evidence.

- **Database connection pool exhaustion:** inventory lookup, checkout/order creation, or product search.
- **Network latency / timeout:** product recommendations, inventory lookup, shipping estimate, payment request, or product search.
- **Bad configuration / deployment:** API Gateway, checkout, or payment integration.
- **Duplicate username validation:** registration page or User Service.
- **Application exception:** product details, cart calculations, checkout, or order creation.
- **Background queue backlog:** background worker or order notifications.
- **Authentication / session issue:** login/session validation or authenticated checkout.
- **Downstream microservice unavailable:** inventory, shipping, or payment service.

These are controlled demo failures, not real production faults. For example, choosing **Network latency / timeout → Shipping estimate** records the action as `shipping_estimate`, returns the expected simulated HTTP 504, and creates the linked SignalRoot incident with the target area in its evidence.


## ShopSphere accounts (login and registration)

ShopSphere includes a login/register dialog in the storefront header. New users can register with a username, optional email, and password; the API stores the account in SQLite. Passwords are **not stored as plaintext**: the backend generates a per-user random salt and stores a PBKDF2-HMAC-SHA256 password hash. Login verifies the hash and updates `last_login_at`.

Endpoints:
- `POST /api/shopsphere/register` — create a ShopSphere account (`username`, `password`, optional `email`). Password must be at least 8 characters.
- `POST /api/shopsphere/login` — validate credentials.

Accounts are stored in the `shopsphere_users` table in the configured SQLite database. These demo endpoints establish account registration/login for the local prototype; before public deployment, add rate limiting, CSRF/session handling or a proper token/session mechanism, email verification, password reset, and production secret/configuration management.

## ShopSphere catalogue, cart and delivery address

ShopSphere includes 30 additional demo products: 10 electrical items, 10 grocery items, and 10 toys, in addition to the original four electronics products. Use the category filters to browse each section.

- **Add to cart** stores item quantities in browser local storage and updates the Bag count.
- **Buy** opens the delivery-address / demo-checkout form.
- **Address** in the header lets you save or edit the delivery address without needing to add an item first.
- **Open address in Google Maps** opens a Google Maps search for the entered street, city and postal code.
- **Place demo order** validates the address and shows a local confirmation. It does not charge a payment method or create a real shipment.

Cart and address data are stored in the current browser on this device. They are not currently synced to the backend database or across browsers/devices.


## ShopSphere port troubleshooting (Windows)

If ShopSphere reports `Port 5174 is already in use`, do not reinstall dependencies. This release lets Vite automatically choose the next available port (for example, 5175). Open the exact `Local:` URL printed in the ShopSphere terminal.

To see which process is listening on port 5174, use this command (the `LISTENING` state is important):

```powershell
Get-NetTCPConnection -State Listen -LocalPort 5174 -ErrorAction SilentlyContinue | Select-Object LocalAddress,LocalPort,OwningProcess
```

If no row is returned, nothing is listening on 5174 at that moment. `netstat -ano | findstr :5174` can also match outbound ports such as `51740`, so inspect the local port and `LISTENING` state before stopping any process.

If Vite starts on 5175 or another port, use that URL for ShopSphere. The `/api` proxy still forwards requests to FastAPI on port 8000.


## ShopSphere QR payment demo

The ShopSphere checkout now includes a UPI QR payment step after delivery details are entered. The supplied QR image is served from `shopsphere/public/payment-qr.jpeg` and shown with the cart total. The customer can mark payment as submitted, but this only records a local UI state: the application does not verify UPI/bank transfers or automatically confirm orders. Manually verify payment in the receiving bank/UPI account before fulfilling an order. Never request or store a UPI PIN, OTP, or banking password.

To test: add an item to the cart, choose Buy/checkout, complete delivery address, continue to payment, and scan the QR using a UPI app. The displayed amount is the current cart total; confirm recipient details and amount in the UPI app before authorizing.


## Add-to-cart database pool failure demo

In ShopSphere, clicking the product-card **Add to cart** (+) button intentionally triggers the controlled `database_pool` scenario at the `cart_calculation` operation. The FastAPI backend records a linked incident, trace/log/metric evidence, request ID, and HTTP 503 response; the frontend then opens the SignalRoot AI assistant with an evidence summary and a button to open the matching incident in SignalRoot. The item is not added to the cart during this failure simulation. This is an isolated demo failure, not a real database pool saturation event.

To test: start the app with `START-HERE-WINDOWS.ps1`, open ShopSphere, click a product card's plus/Add to cart button, wait for the SignalRoot assistant, and choose **Investigate in SignalRoot**.

### Duplicate username validation demo

When a user tries to **create an account** with an existing username, ShopSphere returns a conflict, suggests an available alternative, creates a linked `duplicate_user` SignalRoot incident, and opens the AI incident assistant. Use **Investigate in SignalRoot** to open the incident-specific investigation. Normal sign-in is unaffected.

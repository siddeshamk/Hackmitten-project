# Release notes — ShopSphere to SignalRoot demo

## Included
- Added a separate ShopSphere storefront on port 5174 for local development (port 8081 in Docker).
- Product search intentionally triggers a controlled HTTP 504 timeout scenario.
- FastAPI persists an incident with ShopSphere source metadata, search query, request ID, trace ID, evidence, and timeline entries before returning the simulated error.
- Related trace/log/metric records are saved in the same SignalRoot telemetry store for correlation and dependency mapping.
- ShopSphere displays a SignalRoot incident assistant modal only when the backend response contains the created incident.
- The investigation button redirects to the existing SignalRoot frontend with `incidentId`; SignalRoot loads that incident and opens Root Cause Analysis.
- Added backend integration test and CI build job for ShopSphere.

## Validation in this package environment
- Backend test suite: 5 passed.
- Python compile check: passed.
- JSX syntax checks for both React apps: passed.
- Docker Compose YAML parsed and checked for all four services.
- Docker image build and Vite production builds were not run because Docker is unavailable and npm dependency installation timed out in this environment.

## Run locally
Use `START-HERE-WINDOWS.ps1`, or start the backend on port 8000, SignalRoot on 5173, and ShopSphere on 5174. See `README.md` and `DEPLOYMENT.md`.


## Add-to-cart database pool scenario
- Clicking a product-card Add to cart button triggers the controlled database connection pool exhaustion scenario at `cart_calculation`.
- The backend stores incident and telemetry evidence; ShopSphere opens the SignalRoot AI assistant and links to the incident investigation.
- The item is not added to the cart because this interaction simulates a failed cart calculation.

## Duplicate username registration incident flow

- A registration attempt using an existing username now receives HTTP 409 with a structured message and an available username suggestion.
- ShopSphere records the duplicate-username conflict as a linked SignalRoot incident through `/api/shopsphere/search` using `scenario=duplicate_user` and `user_action=registration`.
- The registration dialog closes and the SignalRoot AI incident popup opens with incident/request/trace details and the suggested username.
- The popup can redirect to the matching SignalRoot investigation via the existing **Investigate in SignalRoot** action.
- Normal login and successful registration flows are unchanged. This flow is only triggered on a real registration conflict.

## Popup visibility fix — login and payment
- Raised the SignalRoot incident overlay above login and checkout dialogs so the assistant cannot be hidden behind them.
- Failed ShopSphere login attempts returning HTTP 401 now create a linked demo authentication incident and open the SignalRoot assistant. The credential error remains generic and does not reveal whether a username exists.
- Added a controlled “Simulate payment service timeout” action in the payment QR panel. It records a `network_timeout` incident at `payment_request`, closes checkout, and opens the assistant with evidence.
- The payment and login failures are controlled demo scenarios; payment is not charged or automatically verified.

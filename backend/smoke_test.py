"""Run a non-destructive smoke test against a running SignalRoot API.

Examples:
  python smoke_test.py
  python smoke_test.py --base-url http://127.0.0.1:8080

This script creates a demo incident and verification records. It does not reset
or delete the user's database.
"""
from __future__ import annotations
import argparse
import json
import sys
import urllib.error
import urllib.request


def request(base: str, path: str, method: str = "GET", payload=None):
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        base.rstrip("/") + path,
        data=data,
        method=method,
        headers={"Content-Type": "application/json"} if data is not None else {},
    )
    try:
        with urllib.request.urlopen(req, timeout=12) as response:
            body = response.read().decode("utf-8")
            return response.status, json.loads(body) if body else None
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"{method} {path} returned HTTP {exc.code}: {body}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Cannot reach {base}. Is the backend running? ({exc})") from exc


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", default="http://127.0.0.1:8000", help="API base URL")
    args = parser.parse_args()
    base = args.base_url.rstrip("/")
    checks = []

    def check(label, fn):
        fn()
        checks.append(label)
        print(f"PASS  {label}")

    check("health endpoint", lambda: _expect(request(base, "/api/health"), 200))
    check("dashboard endpoint", lambda: _expect(request(base, "/api/dashboard"), 200))
    check("scenario catalogue", lambda: _expect(request(base, "/api/scenarios"), 200))

    status, incident = request(base, "/api/incidents/inject", "POST", {
        "scenario_id": "app_exception", "auto_recovery": True, "duration_seconds": 5
    })
    if status != 200 or not isinstance(incident, dict) or not incident.get("id"):
        raise RuntimeError("Could not create a demo incident")
    incident_id = incident["id"]
    check("demo incident creation", lambda: None)

    check("incident analysis", lambda: _expect(request(base, f"/api/incidents/{incident_id}/analysis"), 200))
    check("incident timeline", lambda: _expect(request(base, f"/api/incidents/{incident_id}/timeline"), 200))
    check("dependency map", lambda: _expect(request(base, f"/api/dependencies?incident_id={incident_id}"), 200))
    check("impact analysis", lambda: _expect(request(base, f"/api/impact?incident_id={incident_id}"), 200))
    check("diagnostic plan", lambda: _expect(request(base, f"/api/incidents/{incident_id}/diagnostic-tests"), 200))
    check("verification report", lambda: _expect(request(base, "/api/incidents/" + incident_id + "/verify-regression", "POST"), 200))

    print(f"\nSmoke test passed: {len(checks)} checks. Demo incident: {incident_id}")
    print("Note: the script creates demo records and intentionally does not reset existing data.")
    return 0


def _expect(result, expected_status):
    status, _ = result
    if status != expected_status:
        raise RuntimeError(f"Expected HTTP {expected_status}, got {status}")


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:
        print(f"FAIL  {exc}", file=sys.stderr)
        sys.exit(1)

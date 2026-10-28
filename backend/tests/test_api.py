"""End-to-end API contract tests for the local SignalRoot demo."""
import os
import tempfile
import uuid

# Isolate tests from the user's local demo database before importing the app.
_TEST_DB = os.path.join(tempfile.gettempdir(), f"signalroot-pytest-{os.getpid()}.sqlite")
if os.path.exists(_TEST_DB):
    os.remove(_TEST_DB)
os.environ["SIGNALROOT_DB_PATH"] = _TEST_DB

from fastapi.testclient import TestClient  # noqa: E402
from app.main import app  # noqa: E402

client = TestClient(app)


def reset_lab():
    response = client.post("/api/lab/reset")
    assert response.status_code == 200


def test_health_dashboard_and_scenario_contract():
    reset_lab()
    assert client.get("/api/health").json()["status"] == "ok"
    dashboard = client.get("/api/dashboard")
    assert dashboard.status_code == 200
    assert {"counts", "incidents", "services"} <= dashboard.json().keys()
    scenarios = client.get("/api/scenarios")
    assert scenarios.status_code == 200
    assert any(s["id"] == "database_pool" for s in scenarios.json())


def test_incident_investigation_diagnostics_and_verification():
    reset_lab()
    response = client.post("/api/incidents/inject", json={
        "scenario_id": "database_pool", "auto_recovery": False, "duration_seconds": 5
    })
    assert response.status_code == 200
    incident_id = response.json()["id"]

    for path in (
        f"/api/incidents/{incident_id}",
        f"/api/incidents/{incident_id}/analysis",
        f"/api/incidents/{incident_id}/recurrence",
        f"/api/incidents/{incident_id}/correlation",
        f"/api/incidents/{incident_id}/timeline",
        f"/api/incidents/{incident_id}/diagnostic-tests",
        f"/api/incidents/{incident_id}/verification-history",
    ):
        result = client.get(path)
        assert result.status_code == 200, (path, result.text)

    assert client.post(f"/api/incidents/{incident_id}/run-diagnostics").status_code == 200
    assert client.post(f"/api/incidents/{incident_id}/apply-fix").status_code == 200
    replay = client.post(f"/api/incidents/{incident_id}/replay")
    assert replay.status_code == 200
    report = client.post(f"/api/incidents/{incident_id}/verify-regression")
    assert report.status_code == 200
    assert report.json().get("incident_id") == incident_id
    assert client.get(f"/api/incidents/{incident_id}/verification-report").status_code == 200
    assert client.get(f"/api/dependencies?incident_id={incident_id}").status_code == 200
    assert client.get(f"/api/impact?incident_id={incident_id}").status_code == 200


def test_telemetry_changes_trace_and_dependency_relationships():
    reset_lab()
    trace_id = "trace-test-" + uuid.uuid4().hex[:8]
    first = client.post("/api/telemetry/ingest", json={
        "source": "pytest", "signal_type": "trace", "service_name": "API Gateway",
        "severity": "info", "message": "parent span", "trace_id": trace_id,
        "attributes": {"span_id": "parent-1"},
    })
    second = client.post("/api/telemetry/ingest", json={
        "source": "pytest", "signal_type": "trace", "service_name": "Inventory Service",
        "severity": "error", "message": "child span failed", "trace_id": trace_id,
        "attributes": {"span_id": "child-1", "parent_span_id": "parent-1"},
    })
    assert first.status_code == second.status_code == 200
    assert client.get("/api/telemetry?limit=100").status_code == 200

    change = client.post("/api/changes", json={
        "service_name": "Inventory Service", "change_type": "deployment",
        "version": "test", "summary": "test release", "actor": "pytest",
    })
    assert change.status_code == 200
    assert client.get("/api/changes?limit=100").status_code == 200
    trace = client.post("/api/demo/distributed-request?fail_service=Inventory%20Service")
    assert trace.status_code == 200
    assert trace.json().get("trace_id")
    graph = client.get("/api/dependencies")
    assert graph.status_code == 200
    assert "nodes" in graph.json() and "edges" in graph.json()


def test_playground_assistant_and_http_regression_workflow():
    reset_lab()
    username = "test_" + uuid.uuid4().hex[:12]
    register = client.post("/api/playground/register", json={"username": username})
    assert register.status_code == 200
    assert client.post("/api/playground/login", json={"username": username}).status_code == 200
    assert client.get("/api/playground/data").status_code == 200

    incident = client.post("/api/incidents/inject", json={"scenario_id": "app_exception"})
    assert incident.status_code == 200
    incident_id = incident.json()["id"]
    assistant = client.post("/api/assistant/investigate", json={
        "incident_id": incident_id, "question": "What evidence should I check next?"
    })
    assert assistant.status_code == 200
    assert assistant.json().get("answer")

    http_result = client.post("/api/regression/http-checks")
    assert http_result.status_code == 200
    assert len(http_result.json().get("results", [])) == 5
    baseline = client.post("/api/regression/baseline")
    assert baseline.status_code == 200
    comparison = client.post("/api/regression/compare")
    assert comparison.status_code == 200
    assert "comparisons" in comparison.json()
    assert client.get("/api/regression/http-history").status_code == 200
    assert client.get("/api/regression/snapshots").status_code == 200
    assert client.get("/api/regression/compare/latest").status_code == 200


def test_shopsphere_timeout_creates_correlated_signalroot_incident():
    reset_lab()
    response = client.post("/api/shopsphere/search", json={"query": "wireless headphones", "scenario": "timeout"})
    assert response.status_code == 504
    body = response.json()
    incident = body["incident"]
    assert body["failure_code"] == "SHOPSPHERE_SEARCH_TIMEOUT"
    assert incident["source_app"] == "ShopSphere"
    assert incident["search_query"] == "wireless headphones"
    assert incident["id"].startswith("INC-")
    assert incident["trace_id"] == body["trace_id"]
    assert len(incident["evidence"]) >= 4
    assert client.get(f"/api/incidents/{incident['id']}").status_code == 200
    correlation = client.get(f"/api/incidents/{incident['id']}/correlation").json()
    assert correlation["correlated_count"] >= 4
    assert correlation["trace_group_count"] >= 1
    assert client.get(f"/api/incidents/{incident['id']}/timeline").status_code == 200
    assistant = client.post("/api/assistant/investigate", json={
        "incident_id": incident["id"],
        "question": "Summarize the strongest evidence and next test.",
    })
    assert assistant.status_code == 200
    assert assistant.json().get("answer")


def test_shopsphere_registration_stores_hash_and_login_validates_password():
    username = "shop_" + uuid.uuid4().hex[:10]
    password = "correct-horse-battery"
    created = client.post("/api/shopsphere/register", json={
        "username": username, "password": password, "email": username + "@example.test"
    })
    assert created.status_code == 201, created.text
    assert created.json()["user"]["username"] == username

    import sqlite3
    with sqlite3.connect(os.environ["SIGNALROOT_DB_PATH"]) as db:
        row = db.execute("SELECT password_salt,password_hash FROM shopsphere_users WHERE username=?", (username,)).fetchone()
    assert row and row[0] and row[1]
    assert row[1] != password and len(row[1]) == 64

    good = client.post("/api/shopsphere/login", json={"username": username, "password": password})
    assert good.status_code == 200 and good.json()["ok"] is True
    bad = client.post("/api/shopsphere/login", json={"username": username, "password": "wrong-password"})
    assert bad.status_code == 401
    duplicate = client.post("/api/shopsphere/register", json={"username": username, "password": password})
    assert duplicate.status_code == 409

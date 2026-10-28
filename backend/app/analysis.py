"""Evidence-based incident correlation helpers for the local demo platform."""
from datetime import datetime
from typing import Any

def parse_time(value: str):
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except Exception:
        return None

def score_hypotheses(incident: dict[str, Any], telemetry: list[dict[str, Any]] | None = None):
    """Rank hypotheses from observed evidence, rather than simply trusting the scenario label.

    Scores are transparent heuristics. They are not statistical probabilities and should
    not be interpreted as production-grade root-cause certainty.
    """
    records = list(incident.get("evidence", [])) + list(telemetry or [])
    text = " ".join(str(r.get("message", "")).lower() for r in records)
    scenario_id = incident.get("scenario_id", "")
    signals = {
        "database_pool": [
            ("connection pool saturation", ["pool", "connection", "saturated", "acquire_connection"]),
            ("database latency", ["database", "query", "db.", "sql"]),
        ],
        "app_exception": [
            ("application exception", ["exception", "http 500", "stack trace", "unhandled"]),
            ("endpoint-specific failure", ["/api/", "endpoint", "request handler"]),
        ],
        "network_timeout": [
            ("network timeout", ["timeout", "latency", "downstream", "span duration"]),
            ("retry amplification", ["retry", "attempt", "backoff"]),
        ],
        "queue_backlog": [
            ("queue lag", ["queue", "message age", "backlog"]),
            ("consumer throughput", ["consumer", "worker", "throughput"]),
        ],
        "bad_config": [
            ("configuration change", ["configuration", "config", "deployment", "change"]),
            ("resource contention", ["connection limit", "wait time", "latency"]),
        ],
        "auth_session": [
            ("authentication validation", ["authentication", "token", "session", "validation"]),
            ("configuration mismatch", ["config", "issuer", "expiry"]),
        ],
        "duplicate_user": [
            ("duplicate record validation", ["username", "unique", "duplicate", "constraint"]),
            ("application validation", ["registration", "validation", "insert"]),
        ],
        "downstream_service": [
            ("downstream dependency unavailable", ["inventory", "dependency", "health check", "downstream"]),
            ("partial service degradation", ["trace", "failed", "unavailable"]),
        ],
    }
    known = signals.get(scenario_id, [])
    candidates = []
    for title, keywords in known:
        hits = [kw for kw in keywords if kw in text]
        candidates.append({"cause": title, "score": min(0.95, 0.30 + 0.18 * len(hits)),
                           "matched_signals": hits, "evidence_count": len(hits)})
    if not candidates or not any(c["matched_signals"] for c in candidates):
        candidates.append({"cause": "Insufficient correlated evidence", "score": 0.18,
                           "matched_signals": [], "evidence_count": 0})
    candidates.sort(key=lambda c: c["score"], reverse=True)
    for i, c in enumerate(candidates, 1):
        c["rank"] = i
        c["confidence_label"] = "strong signal match" if c["score"] >= .7 else "partial signal match" if c["score"] >= .45 else "weak signal match"
    return candidates

def explain_from_evidence(incident: dict[str, Any], ranked: list[dict[str, Any]]):
    top = ranked[0] if ranked else None
    if not top or not top.get("matched_signals"):
        return {
            "summary": "The available evidence is insufficient to identify a reliable root cause.",
            "hypothesis": None, "supporting_signals": [], "limitations": [
                "No scenario-specific evidence signals matched.",
                "Collect additional logs, metrics, traces, and change events before concluding."
            ],
            "recommended_next_steps": ["Inspect the failing request and its trace.", "Compare metrics before and during the incident.",
                                       "Review recent deployments and configuration changes."]
        }
    return {
        "summary": f"The leading hypothesis is '{top['cause']}' because {len(top['matched_signals'])} matching signal(s) were found in the stored evidence.",
        "hypothesis": top["cause"],
        "supporting_signals": top["matched_signals"],
        "limitations": ["This is a transparent heuristic, not an LLM diagnosis or a calibrated probability.",
                        "Confirm the hypothesis against linked raw evidence and check competing causes."],
        "recommended_next_steps": [
            "Open the matching evidence records and verify their timestamps and service names.",
            "Compare related metrics and traces immediately before the first symptom.",
            "Apply any correction only after engineer review, then replay the scenario."
        ]
    }

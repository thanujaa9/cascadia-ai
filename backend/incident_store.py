"""
CASCADIA — Incident Persistence & Historical Incident Store
SQLite persistence for incident runs, timelines, decisions, and pre-seeded benchmark incidents.
"""

import sqlite3
import json
import os
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone, timedelta

DB_FILE = os.path.join(os.path.dirname(__file__), "cascadia_incidents.db")

class IncidentStore:
    def __init__(self, db_path: str = DB_FILE):
        self.db_path = db_path
        self._init_db()

    def _get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS incidents (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    scenario_name TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    status TEXT NOT NULL,
                    root_cause_service TEXT,
                    recovery_strategy TEXT,
                    blast_radius_pct REAL,
                    mttr_seconds INTEGER,
                    summary TEXT,
                    metrics_json TEXT
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS timeline_records (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    incident_id TEXT NOT NULL,
                    tick INTEGER NOT NULL,
                    timestamp TEXT NOT NULL,
                    event_type TEXT NOT NULL,
                    description TEXT NOT NULL,
                    severity TEXT NOT NULL,
                    FOREIGN KEY(incident_id) REFERENCES incidents(id)
                )
            """)
            conn.commit()

        # Seed realistic historical incidents if empty
        self._seed_historical_incidents()

    def _seed_historical_incidents(self):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM incidents")
            if cursor.fetchone()[0] == 0:
                past_incidents = [
                    (
                        "INC-8092",
                        "Primary Postgres Connection Starvation",
                        "database_slowdown",
                        (datetime.now(timezone.utc) - timedelta(days=4, hours=3)).isoformat(),
                        "RESOLVED",
                        "database",
                        "enable_cache_fallback",
                        0.0,
                        8,
                        "Lock contention on orders table caused downstream 504 timeouts at API Gateway. Contained via Redis cache fallback in 8s.",
                        json.dumps({"latency_drop": "98.4%", "saved_requests": 18250})
                    ),
                    (
                        "INC-8041",
                        "Kafka Buffer Ingestion Surge",
                        "queue_overload",
                        (datetime.now(timezone.utc) - timedelta(days=12, hours=8)).isoformat(),
                        "RESOLVED",
                        "queue",
                        "scale_workers",
                        0.0,
                        12,
                        "Notification buffer reached 8,000 pending messages. Worker pool scaled 3x; queue normalized in 12s.",
                        json.dumps({"consumer_rate": "2550 msg/s", "queue_drained": 8000})
                    ),
                    (
                        "INC-7988",
                        "Payment Gateway OOM Container Crash Loop",
                        "payments_crash",
                        (datetime.now(timezone.utc) - timedelta(days=21, hours=14)).isoformat(),
                        "RESOLVED",
                        "payments",
                        "circuit_breaker",
                        16.7,
                        5,
                        "Unhandled nil pointer exception in authorization worker. Circuit breaker tripped to allow asynchronous checkout.",
                        json.dumps({"fast_fail_ms": 2, "blast_contained": "88%"})
                    )
                ]
                cursor.executemany("""
                    INSERT INTO incidents (id, title, scenario_name, created_at, status, root_cause_service, recovery_strategy, blast_radius_pct, mttr_seconds, summary, metrics_json)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, past_incidents)
                conn.commit()

    def save_incident(self, incident_data: Dict[str, Any]) -> str:
        incident_id = incident_data.get("id", f"INC-{int(datetime.now(timezone.utc).timestamp()) % 100000:05d}")
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO incidents 
                (id, title, scenario_name, created_at, status, root_cause_service, recovery_strategy, blast_radius_pct, mttr_seconds, summary, metrics_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                incident_id,
                incident_data.get("title", f"Incident {incident_id}"),
                incident_data.get("scenario_name", "custom"),
                incident_data.get("created_at", datetime.now(timezone.utc).isoformat()),
                incident_data.get("status", "RESOLVED"),
                incident_data.get("root_cause_service", "database"),
                incident_data.get("recovery_strategy", "enable_cache_fallback"),
                incident_data.get("blast_radius_pct", 0.0),
                incident_data.get("mttr_seconds", 8),
                incident_data.get("summary", ""),
                json.dumps(incident_data.get("metrics", {}))
            ))
            conn.commit()
        return incident_id

    def get_all_incidents(self) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM incidents ORDER BY created_at DESC")
            rows = cursor.fetchall()
            return [dict(row) for row in rows]

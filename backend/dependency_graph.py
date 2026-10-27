"""
CASCADIA — Dependency Graph Module
Defines service topology, dependency relationships, coupling weights, and blast radius calculation.
"""

from typing import Dict, List, Any, Optional

SERVICES_TOPOLOGY = {
    "gateway": {
        "id": "gateway",
        "name": "API Gateway",
        "tier": "INGRESS",
        "description": "Ingress routing, SSL termination, and client rate limiting",
        "normal_latency": 18.0,
        "normal_error_rate": 0.02,
        "normal_rps": 1250,
        "normal_cpu": 32.0,
        "normal_memory": 45.0,
        "downstream": ["orders", "payments"],
        "coupling_type": "SYNCHRONOUS_HTTP"
    },
    "orders": {
        "id": "orders",
        "name": "Order Service",
        "tier": "APPLICATION",
        "description": "Cart checkout orchestration, order state machine, and inventory reservation",
        "normal_latency": 42.0,
        "normal_error_rate": 0.05,
        "normal_rps": 680,
        "normal_cpu": 48.0,
        "normal_memory": 58.0,
        "downstream": ["database", "queue"],
        "coupling_type": "SYNCHRONOUS_RPC"
    },
    "payments": {
        "id": "payments",
        "name": "Payment Service",
        "tier": "APPLICATION",
        "description": "Payment authorization, merchant settlement, and transaction logging",
        "normal_latency": 55.0,
        "normal_error_rate": 0.03,
        "normal_rps": 420,
        "normal_cpu": 42.0,
        "normal_memory": 52.0,
        "downstream": ["database"],
        "coupling_type": "SYNCHRONOUS_RPC"
    },
    "database": {
        "id": "database",
        "name": "Primary Database",
        "tier": "STORAGE",
        "description": "Primary PostgreSQL cluster with write-ahead log and connection pooling",
        "normal_latency": 12.0,
        "normal_error_rate": 0.01,
        "normal_rps": 2800,
        "normal_cpu": 38.0,
        "normal_memory": 62.0,
        "downstream": [],
        "coupling_type": "PERSISTENCE"
    },
    "queue": {
        "id": "queue",
        "name": "Message Broker",
        "tier": "MESSAGING",
        "description": "RabbitMQ / Kafka streaming queue buffering asynchronous order events",
        "normal_latency": 8.0,
        "normal_error_rate": 0.00,
        "normal_rps": 850,
        "normal_cpu": 25.0,
        "normal_memory": 40.0,
        "normal_queue_depth": 45,
        "downstream": ["notifications"],
        "coupling_type": "EVENT_STREAM"
    },
    "notifications": {
        "id": "notifications",
        "name": "Notification Worker",
        "tier": "ASYNC_WORKER",
        "description": "Email, SMS, and webhook dispatcher consuming order completion events",
        "normal_latency": 35.0,
        "normal_error_rate": 0.02,
        "normal_rps": 380,
        "normal_cpu": 22.0,
        "normal_memory": 35.0,
        "downstream": [],
        "coupling_type": "ASYNC_CONSUMER"
    }
}

# Explicit directed edges with coupling strength (0.0 to 1.0) and failure propagation latency (seconds)
DEPENDENCY_EDGES = [
    {
        "source": "gateway",
        "target": "orders",
        "type": "SYNCHRONOUS_HTTP",
        "coupling_strength": 0.95,
        "propagation_delay_sec": 18,
        "timeout_ms": 1000
    },
    {
        "source": "gateway",
        "target": "payments",
        "type": "SYNCHRONOUS_HTTP",
        "coupling_strength": 0.85,
        "propagation_delay_sec": 22,
        "timeout_ms": 1200
    },
    {
        "source": "orders",
        "target": "database",
        "type": "DATABASE_QUERY",
        "coupling_strength": 0.98,
        "propagation_delay_sec": 8,
        "timeout_ms": 500
    },
    {
        "source": "orders",
        "target": "queue",
        "type": "ASYNC_MESSAGE",
        "coupling_strength": 0.60,
        "propagation_delay_sec": 40,
        "timeout_ms": 2000
    },
    {
        "source": "payments",
        "target": "database",
        "type": "DATABASE_QUERY",
        "coupling_strength": 0.92,
        "propagation_delay_sec": 10,
        "timeout_ms": 600
    },
    {
        "source": "queue",
        "target": "notifications",
        "type": "ASYNC_CONSUME",
        "coupling_strength": 0.75,
        "propagation_delay_sec": 30,
        "timeout_ms": 5000
    }
]

class DependencyGraph:
    def __init__(self):
        self.services = SERVICES_TOPOLOGY
        self.edges = DEPENDENCY_EDGES
        # Build inverted adjacency list: callers (upstream) of a service
        # When service X slows down, its CALLERS (who wait for X) are impacted!
        self.callers: Dict[str, List[str]] = {s_id: [] for s_id in self.services}
        self.callees: Dict[str, List[str]] = {s_id: [] for s_id in self.services}
        
        for edge in self.edges:
            src = edge["source"]
            dst = edge["target"]
            self.callees[src].append(dst)
            self.callers[dst].append(src)

    def get_services(self) -> Dict[str, Any]:
        return self.services

    def get_edges(self) -> List[Dict[str, Any]]:
        return self.edges

    def get_upstream_callers(self, service_id: str) -> List[str]:
        """Services that call this service directly (e.g. database -> orders, payments)"""
        return self.callers.get(service_id, [])

    def get_downstream_dependencies(self, service_id: str) -> List[str]:
        """Services this service directly calls (e.g. orders -> database, queue)"""
        return self.callees.get(service_id, [])

    def get_all_upstream_impacted(self, service_id: str) -> List[Dict[str, Any]]:
        """
        When service_id suffers latency/failure, trace failure BACKWARDS up the call graph
        (e.g., database stalls -> orders & payments stall -> gateway stalls).
        Returns ordered cascade chain with hops and estimated delay.
        """
        visited = set()
        cascade_chain = []
        
        def traverse(current_id: str, current_hop: int, accumulated_delay: int, path: List[str]):
            for edge in self.edges:
                if edge["target"] == current_id and edge["source"] not in visited:
                    src = edge["source"]
                    visited.add(src)
                    hop_delay = accumulated_delay + edge["propagation_delay_sec"]
                    new_path = path + [src]
                    cascade_chain.append({
                        "service_id": src,
                        "service_name": self.services[src]["name"],
                        "hop_distance": current_hop + 1,
                        "estimated_delay_sec": hop_delay,
                        "coupling_type": edge["type"],
                        "coupling_strength": edge["coupling_strength"],
                        "path": new_path
                    })
                    traverse(src, current_hop + 1, hop_delay, new_path)

        visited.add(service_id)
        traverse(service_id, 0, 0, [service_id])
        return sorted(cascade_chain, key=lambda x: x["estimated_delay_sec"])

    def calculate_blast_radius(self, origin_service_id: str) -> Dict[str, Any]:
        """Calculates theoretical blast radius if origin service fails completely."""
        impacted = self.get_all_upstream_impacted(origin_service_id)
        impacted_ids = [item["service_id"] for item in impacted] + [origin_service_id]
        total_services = len(self.services)
        affected_count = len(impacted_ids)
        percentage = round((affected_count / total_services) * 100, 1)

        # Categorize tier impact
        tiers_affected = list(set(self.services[sid]["tier"] for sid in impacted_ids))

        return {
            "origin_service": origin_service_id,
            "origin_name": self.services[origin_service_id]["name"],
            "total_services": total_services,
            "affected_service_count": affected_count,
            "blast_radius_pct": percentage,
            "affected_services": impacted_ids,
            "cascade_hops": len(impacted),
            "tiers_affected": tiers_affected,
            "severity": "CRITICAL" if percentage >= 50 else ("HIGH" if percentage >= 30 else "MODERATE")
        }

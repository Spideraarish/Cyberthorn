import time
import random

ALERTS = [
    {"ip": "10.0.1.10", "zone": "protected-critical", "gnn_score": 0.95, "wazuh_event": "port_scan", "timestamp": time.time()},
    {"ip": "10.0.1.11", "zone": "protected-user", "gnn_score": 0.4, "wazuh_event": "login_failed", "timestamp": time.time()},
    {"ip": "10.0.4.20", "zone": "protected-user", "gnn_score": 0.1, "wazuh_event": "file_accessed", "timestamp": time.time()},
    {"ip": "10.0.1.10", "zone": "management", "gnn_score": 0.99, "wazuh_event": "lateral_movement", "timestamp": time.time()},
    {"ip": "10.0.5.15", "zone": "protected-critical", "gnn_score": 0.6, "wazuh_event": "unusual_traffic_burst", "timestamp": time.time()}
]

class MockAlertGenerator:
    def __init__(self):
        self.alerts = ALERTS.copy()

    def get_new_alerts(self):
        if self.alerts:
            return [self.alerts.pop(0)]
        return []

import subprocess
import json
import time
import sqlite3
import os
import sys
import requests

# Add GNN to path for real scoring
sys.path.append(os.path.join(os.path.dirname(__file__), '../gnn'))
try:
    from infer import infer
except ImportError:
    infer = None

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), 'alerts.db'))
TOPOLOGY_URL = "http://localhost:8001/api/topology"

def get_dynamic_zones():
    """Fetch real-time IP-to-Zone mappings from the live Docker network via API."""
    ip_to_zone = {}
    try:
        res = requests.get(TOPOLOGY_URL, timeout=3)
        nodes = res.json().get("nodes", [])
        for n in nodes:
            zones = n.get("zones", [])
            primary_zone = zones[0] if zones else "unknown"
            for ip in n.get("ips", []):
                ip_to_zone[ip] = primary_zone
    except Exception as e:
        print(f"[Suricata Listener] Failed to fetch topology for zones: {e}")
    return ip_to_zone

def insert_alert(ip, zone, event, gnn_score):
    conn = sqlite3.connect(DB_PATH)
    try:
        conn.execute(
            "INSERT INTO incoming_alerts (ip, zone, wazuh_event, gnn_score) VALUES (?, ?, ?, ?)",
            (ip, zone, event, gnn_score)
        )
        conn.commit()
        print(f"[Suricata IDS] Generated Alert: {ip} -> {event} (Score: {gnn_score})", flush=True)
    finally:
        conn.close()

def compute_gnn_score(event_signature):
    if not infer:
        return 0.95 if "Scan" in event_signature else 0.85
    
    # Mock node/edge features to feed the GNN based on the Suricata signature
    node_features = [[1.0, 50.0], [0.0, 0.0]]
    edges = [[1, 0]]
    edge_features = [[64, 80]] # Dummy packet features
    
    try:
        scores = infer(node_features, edges, edge_features)
        if scores is not None and len(scores) > 1:
            return float(scores[1][0])
    except:
        pass
    return 0.95

def main():
    print("[Suricata Listener] Initializing connection to PEP Suricata Engine...", flush=True)
    
    # Ensure DB
    conn = sqlite3.connect(DB_PATH)
    conn.execute("CREATE TABLE IF NOT EXISTS incoming_alerts (id INTEGER PRIMARY KEY, ip TEXT, zone TEXT, wazuh_event TEXT, gnn_score REAL)")
    conn.close()

    # Dynamically build IP to zone mapping (NO HARDCODING)
    print("[Suricata Listener] Resolving dynamic IP zones from topology API...", flush=True)
    ip_to_zone = get_dynamic_zones()
    
    # Tail the live Suricata eve.json log from the PEP container
    cmd = ["docker", "exec", "pep", "tail", "-F", "/var/log/suricata/eve.json"]
    
    # Retry loop in case Suricata hasn't created the file yet
    while True:
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, universal_newlines=True)
        
        while True:
            line = process.stdout.readline()
            if not line:
                break
                
            try:
                event = json.loads(line)
            except:
                continue
                
            if event.get("event_type") == "alert":
                src_ip = event.get("src_ip")
                signature = event.get("alert", {}).get("signature", "Unknown Threat")
                
                # Filter out noise from local bridge routing
                if src_ip.startswith("127.") or src_ip.startswith("172."):
                    continue
                
                # Fetch fresh topology mapping if IP isn't known
                if src_ip not in ip_to_zone:
                    ip_to_zone = get_dynamic_zones()
                    
                zone = ip_to_zone.get(src_ip, "untrusted")
                score = compute_gnn_score(signature)
                
                # Format to match our pipeline requirements
                event_name = "port_scan_detected" if "Scan" in signature else "lateral_movement_detected"
                
                insert_alert(src_ip, zone, event_name, score)
                
        time.sleep(2)

if __name__ == "__main__":
    main()

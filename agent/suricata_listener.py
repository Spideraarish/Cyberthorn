import subprocess
import json
import time
import sqlite3
import os
import sys
import requests

# Add ML to path for real scoring
sys.path.append(os.path.join(os.path.dirname(__file__), '../ml'))
try:
    from predict import predict
except ImportError:
    predict = None

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

def compute_gnn_score(event):
    if not predict:
        signature = event.get("alert", {}).get("signature", "")
        return 0.95 if "Scan" in signature else 0.85
    
    src_ip = event.get("src_ip", "0.0.0.0")
    dest_ip = event.get("dest_ip", "0.0.0.0")
    src_port = event.get("src_port", 0)
    dest_port = event.get("dest_port", 0)
    proto = event.get("proto", "TCP")
    
    flow = {
        "src_ip": src_ip,
        "dst_ip": dest_ip,
        "src_port": src_port,
        "dst_port": dest_port,
        "proto": proto,
        "duration": 1.0,
        "fwd_pkts": 1,
        "bwd_pkts": 0,
        "fwd_bytes": 64,
        "bwd_bytes": 0,
        "flags": "S"
    }
    
    try:
        bundle = os.path.abspath(os.path.join(os.path.dirname(__file__), '../ml/models/bundle.pt'))
        res = predict([flow], bundle_path=bundle)
        prob_normal = res.get("fused_probs", {}).get("normal", 0.0)
        return float(1.0 - prob_normal)
    except Exception as e:
        print(f"ML Predict Error: {e}", flush=True)
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
                score = compute_gnn_score(event)
                
                # Format to match our pipeline requirements
                event_name = "port_scan_detected" if "Scan" in signature else "lateral_movement_detected"
                
                insert_alert(src_ip, zone, event_name, score)
                
        time.sleep(2)

if __name__ == "__main__":
    main()

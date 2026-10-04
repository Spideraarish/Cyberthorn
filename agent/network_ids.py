import subprocess
import re
import time
import sqlite3
import os
import sys
from collections import defaultdict

# Add GNN to path for real scoring
sys.path.append(os.path.join(os.path.dirname(__file__), '../gnn'))
try:
    from infer import infer
except ImportError:
    infer = None

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), 'alerts.db'))

import requests

TOPOLOGY_URL = "http://localhost:8001/api/topology"
DYNAMIC_ZONES = {}

def update_zones():
    global DYNAMIC_ZONES
    try:
        res = requests.get(TOPOLOGY_URL, timeout=2).json()
        for node in res.get("nodes", []):
            zone = node.get("zones", ["unknown"])[0]
            for ip in node.get("ips", []):
                DYNAMIC_ZONES[ip] = zone
    except Exception as e:
        pass

def get_zone(ip):
    if not DYNAMIC_ZONES:
        update_zones()
    return DYNAMIC_ZONES.get(ip, "unknown")

def insert_alert(ip, zone, event, gnn_score):
    conn = sqlite3.connect(DB_PATH)
    try:
        conn.execute(
            "INSERT INTO incoming_alerts (ip, zone, wazuh_event, gnn_score) VALUES (?, ?, ?, ?)",
            (ip, zone, event, gnn_score)
        )
        conn.commit()
        print(f"[Network IDS] Generated Alert: {ip} -> {event} (Score: {gnn_score})", flush=True)
    finally:
        conn.close()

def compute_gnn_score(metrics):
    if not infer:
        return 0.85 # fallback
    
    # metrics: { 'ports': set(), 'count': int }
    # Graph representation: Node 0 is target, Node 1 is attacker
    node_features = [
        [1.0, 50.0], # target
        [0.0, 0.0]   # attacker
    ]
    
    # Edges: simulate the packet flow
    edges = []
    edge_features = []
    
    ports = list(metrics['ports'])
    if not ports:
        ports = [80]
        
    for p in ports[:5]: # up to 5 edges to prevent huge graphs
        edges.append([1, 0])
        edge_features.append([64, p]) # 64 bytes, dest port
        
    try:
        scores = infer(node_features, edges, edge_features)
        # return the score for the attacker node (node 1)
        if scores is not None and len(scores) > 1:
            return float(scores[1][0])
    except Exception as e:
        print(f"GNN Error: {e}", flush=True)
    
    return 0.90

def main():
    print("[Network IDS] Starting packet capture on PEP router...", flush=True)
    
    # Initialize DB
    conn = sqlite3.connect(DB_PATH)
    conn.execute("CREATE TABLE IF NOT EXISTS incoming_alerts (id INTEGER PRIMARY KEY, ip TEXT, zone TEXT, wazuh_event TEXT, gnn_score REAL)")
    conn.close()

    # Capture all TCP traffic leaving the attacker node (ensures we see it regardless of Docker's internal bridge routing)
    cmd = ["docker", "exec", "attacker", "tcpdump", "-l", "-nn", "-i", "any", "tcp"]
    process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, universal_newlines=True)

    # State tracking: IP -> { 'count': X, 'ports': set(), 'window_start': T, 'alerted': bool }
    state = defaultdict(lambda: {'count': 0, 'ports': set(), 'window_start': time.time(), 'alerted': False})

    # Regex to parse tcpdump standard output: 
    # e.g., 16:11:00.123456 IP 10.0.1.10.54321 > 10.0.4.10.80: Flags [S]
    pattern = re.compile(r"IP (\d+\.\d+\.\d+\.\d+)\.(\d+) > (\d+\.\d+\.\d+\.\d+)\.(\d+): Flags \[([SFP\.]+)\]")

    while True:
        line = process.stdout.readline()
        if not line:
            break
            
        match = pattern.search(line)
        if not match:
            continue
            
        src_ip = match.group(1)
        # Skip local/docker bridge IPs
        if src_ip.startswith("127.") or src_ip == "10.0.2.254" or src_ip.startswith("172."):
            continue

        dest_port = int(match.group(4))
        flags = match.group(5)
        
        now = time.time()
        s = state[src_ip]
        
        # Reset window after 5 seconds
        if now - s['window_start'] > 5:
            s['count'] = 0
            s['ports'] = set()
            s['alerted'] = False
            s['window_start'] = now
            
        s['count'] += 1
        s['ports'].add(dest_port)

        # Detection Logic
        if not s['alerted']:
            if len(s['ports']) >= 2 and 'S' in flags:
                # Port Scan (many SYN packets to different ports)
                score = compute_gnn_score(s)
                insert_alert(src_ip, get_zone(src_ip), "port_scan_detected", score)
                s['alerted'] = True
            elif s['count'] > 5:
                # Traffic burst / Flood
                score = compute_gnn_score(s) - 0.2 # Lower anomaly score for just a flood vs a port scan
                score = max(0.4, min(score, 0.99))
                event = "lateral_movement_detected" if get_zone(src_ip).startswith("protected") else "unusual_traffic_burst"
                insert_alert(src_ip, get_zone(src_ip), event, score)
                s['alerted'] = True

if __name__ == "__main__":
    main()

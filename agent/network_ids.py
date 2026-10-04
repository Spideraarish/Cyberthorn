import subprocess
import re
import time
import sqlite3
import os
import sys
import threading
from collections import defaultdict
import requests

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), 'alerts.db'))
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
    except Exception:
        pass

def get_zone(ip):
    if not DYNAMIC_ZONES:
        update_zones()
    zone = DYNAMIC_ZONES.get(ip)
    if not zone or zone == "unknown":
        if ip.startswith("10.0.1."):
            return "untrusted"
        elif ip.startswith("10.0.5."):
            return "protected-user"
        elif ip.startswith("10.0.4."):
            return "protected-critical"
    return zone or "unknown"

def insert_alert(ip, zone, event, gnn_score):
    conn = sqlite3.connect(DB_PATH)
    try:
        conn.execute(
            "INSERT INTO incoming_alerts (ip, zone, wazuh_event, gnn_score) VALUES (?, ?, ?, ?)",
            (ip, zone, event, gnn_score)
        )
        conn.commit()
        print(f"[Network IDS] Generated Alert: {ip} ({zone}) -> {event} (Score: {gnn_score})", flush=True)
    finally:
        conn.close()

# Shared state across threads for IP detection
state = defaultdict(lambda: {'count': 0, 'ports': set(), 'window_start': time.time(), 'last_seen': time.time(), 'alerted': False})
state_lock = threading.Lock()

def run_capture(container_name):
    print(f"[Network IDS] Starting HIDS agent on endpoint: {container_name}...", flush=True)
    pattern = re.compile(r"IP (\d+\.\d+\.\d+\.\d+)\.(\d+) > (\d+\.\d+\.\d+\.\d+)\.(\d+): Flags \[([SFP\.]+)\]")

    while True:
        try:
            cmd = ["docker", "exec", container_name, "tcpdump", "-l", "-nn", "-i", "any", "tcp"]
            process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, universal_newlines=True)

            while True:
                line = process.stdout.readline()
                if not line:
                    break

                match = pattern.search(line)
                if not match:
                    continue

                src_ip = match.group(1)
                dest_ip = match.group(3)
                dest_port = int(match.group(4))
                flags = match.group(5)

                # Ignore management traffic, localhost, and docker host IPs
                if (src_ip.startswith("127.") or dest_ip.startswith("127.") or
                    src_ip == "10.0.2.254" or src_ip.startswith("172.") or
                    dest_port in [8000, 8001]):
                    continue

                # Only track TCP connection initiations (pure SYN, excluding server SYN-ACK or ACK)
                if 'S' not in flags or '.' in flags:
                    continue

                now = time.time()
                with state_lock:
                    s = state[src_ip]

                    # Reset window if > 2.5 seconds have passed or gap between bursts is > 1.5s
                    if (now - s['window_start'] > 2.5) or (now - s['last_seen'] > 1.5):
                        s['count'] = 0
                        s['ports'] = set()
                        s['alerted'] = False
                        s['window_start'] = now

                    s['last_seen'] = now
                    s['count'] += 1
                    s['ports'].add(dest_port)

                    if not s['alerted']:
                        zone = get_zone(src_ip)
                        if len(s['ports']) >= 2 and 'S' in flags:
                            # Port Scan / Recon
                            if zone.startswith("protected"):
                                event = "lateral_movement_detected"
                                score = 0.88
                            else:
                                event = "port_scan_detected"
                                score = 0.95
                            insert_alert(src_ip, zone, event, score)
                            s['alerted'] = True
                        elif s['count'] >= 4:
                            # HTTP burst / flood to single port
                            event = "unusual_traffic_burst"
                            score = 0.45
                            insert_alert(src_ip, zone, event, score)
                            s['alerted'] = True
        except Exception as e:
            print(f"[Network IDS] Listener {container_name} error: {e}", flush=True)

        time.sleep(1)

def main():
    print("[Network IDS] Initializing distributed HIDS agents...", flush=True)

    # Initialize DB
    conn = sqlite3.connect(DB_PATH)
    conn.execute("CREATE TABLE IF NOT EXISTS incoming_alerts (id INTEGER PRIMARY KEY, ip TEXT, zone TEXT, wazuh_event TEXT, gnn_score REAL)")
    conn.close()

    endpoints = ["attacker", "victim-user", "pep"]
    threads = []

    for ep in endpoints:
        t = threading.Thread(target=run_capture, args=(ep,), daemon=True)
        t.start()
        threads.append(t)

    for t in threads:
        t.join()

if __name__ == "__main__":
    main()

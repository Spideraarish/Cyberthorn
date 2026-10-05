import subprocess
import re
import time
import sqlite3
import os
import sys
import threading
import random
from collections import defaultdict
import requests

sys.path.append(os.path.join(os.path.dirname(__file__), '../ml'))
try:
    from predict import predict
except ImportError:
    predict = None

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

def insert_alert(ip, zone, event, gnn_score, cnn_score, fused_score):
    conn = sqlite3.connect(DB_PATH)
    try:
        conn.execute(
            "INSERT INTO incoming_alerts (ip, zone, wazuh_event, gnn_score, cnn_score, fused_score) VALUES (?, ?, ?, ?, ?, ?)",
            (ip, zone, event, gnn_score, cnn_score, fused_score)
        )
        conn.commit()
        print(f"[Network IDS] Generated Alert: {ip} ({zone}) -> {event} (Scores - GNN: {gnn_score}, CNN: {cnn_score}, Fused: {fused_score})", flush=True)
    finally:
        conn.close()

# Shared state across threads for IP detection, keyed by (container, ip)
state = defaultdict(lambda: {'count': 0, 'ports': set(), 'window_start': time.time(), 'last_seen': time.time(), 'alerted': False, 'dest_ip': None})
state_lock = threading.Lock()
recent_alerts = {}
last_reset_time = 0.0
RESET_FLAG_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '.reset_flag'))

def check_reset_signal():
    global last_reset_time
    if os.path.exists(RESET_FLAG_PATH):
        try:
            with open(RESET_FLAG_PATH, 'r') as f:
                val = float(f.read().strip())
            if val > last_reset_time:
                last_reset_time = val
                state.clear()
                recent_alerts.clear()
        except Exception:
            pass

def run_capture(container_name):
    print(f"[Network IDS] Starting HIDS agent on endpoint: {container_name}...", flush=True)
    tcp_pattern = re.compile(r"IP (\d+\.\d+\.\d+\.\d+)\.(\d+) > (\d+\.\d+\.\d+\.\d+)\.(\d+): Flags \[([SFP\.]+)\]")
    icmp_pattern = re.compile(r"IP (\d+\.\d+\.\d+\.\d+) > (\d+\.\d+\.\d+\.\d+): ICMP echo request")

    while True:
        try:
            cmd = ["docker", "exec", container_name, "tcpdump", "-l", "-nn", "-i", "any", "tcp or icmp"]
            process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, universal_newlines=True)

            while True:
                line = process.stdout.readline()
                if not line:
                    break

                dest_port = 0
                flags = 'S'
                src_ip = None
                dest_ip = None

                match_tcp = tcp_pattern.search(line)
                if match_tcp:
                    src_ip = match_tcp.group(1)
                    dest_ip = match_tcp.group(3)
                    dest_port = int(match_tcp.group(4))
                    flags = match_tcp.group(5)
                    # Ignore non-SYN connection tracking (ignore ACKs/data)
                    if 'S' not in flags or '.' in flags:
                        continue
                else:
                    match_icmp = icmp_pattern.search(line)
                    if match_icmp:
                        src_ip = match_icmp.group(1)
                        dest_ip = match_icmp.group(2)
                        dest_port = 0
                        flags = 'S'
                    else:
                        continue

                # Ignore management traffic, localhost, and docker host IPs
                if (src_ip.startswith("127.") or dest_ip.startswith("127.") or
                    src_ip == "10.0.2.254" or src_ip.startswith("172.") or
                    (dest_ip == "10.0.2.254" and dest_port in [8000, 8001])):
                    continue

                now = time.time()
                with state_lock:
                    check_reset_signal()
                    s = state[(container_name, src_ip)]
                    s['dest_ip'] = dest_ip

                    # Reset window if > 2.5 seconds have passed or gap between bursts is > 1.5s
                    if (now - s['window_start'] > 2.5) or (now - s['last_seen'] > 1.5):
                        s['count'] = 0
                        s['ports'] = set()
                        s['alerted'] = False
                        s['window_start'] = now

                    s['last_seen'] = now
                    s['count'] += 1
                    if dest_port > 0:
                        s['ports'].add(dest_port)

                    # Deduplicate across containers for the same source within 1.0 second
                    if now - recent_alerts.get(src_ip, 0) < 1.0:
                        continue

                    if not s['alerted']:
                        zone = get_zone(src_ip)
                        should_alert = False
                        event = "unusual_traffic"

                        if len(s['ports']) >= 2:
                            # Multi-port scanning / sweep
                            event = "lateral_movement_detected" if zone.startswith("protected") else "port_scan_detected"
                            should_alert = True
                        elif s['count'] >= 4:
                            # Burst to single service / endpoint
                            if dest_port == 22:
                                event = "ssh_probe_detected"
                            elif src_ip.startswith("10.0.4."):
                                event = "exfiltration_detected"
                            elif zone.startswith("protected"):
                                event = "internal_endpoint_crawl"
                            elif dest_port == 0:
                                event = "ping_sweep_detected"
                            else:
                                event = "unusual_traffic_burst"
                            should_alert = True

                        if should_alert:
                            # Assemble flow records for live ML inference
                            flows = []
                            target_ports = list(s['ports']) if s['ports'] else [dest_port]
                            for p in target_ports:
                                flows.append({
                                    "src_ip": src_ip, "dst_ip": dest_ip,
                                    "src_port": random.randint(10000, 60000), "dst_port": p,
                                    "proto": "TCP" if dest_port != 0 else "ICMP",
                                    "duration": 0.5, "fwd_pkts": s['count'], "bwd_pkts": 0,
                                    "fwd_bytes": s['count'] * 64, "bwd_bytes": 0, "flags": "S"
                                })
                            # Pad to flow window for full graph & CNN spatial density
                            while len(flows) < 20:
                                flows.append({
                                    "src_ip": src_ip, "dst_ip": dest_ip,
                                    "src_port": random.randint(10000, 60000),
                                    "dst_port": random.choice(target_ports),
                                    "proto": "TCP", "duration": 0.1, "fwd_pkts": 1, "bwd_pkts": 0,
                                    "fwd_bytes": 64, "bwd_bytes": 0, "flags": "S"
                                })

                            gnn_score, cnn_score, fused_score = 0.5, 0.5, 0.5
                            if predict:
                                try:
                                    bundle = os.path.abspath(os.path.join(os.path.dirname(__file__), '../ml/models/bundle.pt'))
                                    res = predict(flows, bundle_path=bundle)
                                    gnn_score = round(float(1.0 - res.get("gnn_probs", {}).get("normal", 0.0)), 4)
                                    cnn_score = round(float(1.0 - res.get("cnn_probs", {}).get("normal", 0.0)), 4)
                                    fused_score = round(float(1.0 - res.get("fused_probs", {}).get("normal", 0.0)), 4)
                                except Exception as err:
                                    print(f"ML evaluation error: {err}", flush=True)

                            insert_alert(src_ip, zone, event, gnn_score, cnn_score, fused_score)
                            s['alerted'] = True
                            recent_alerts[src_ip] = now
        except Exception as e:
            print(f"[Network IDS] Listener {container_name} error: {e}", flush=True)

        time.sleep(1)

def main():
    print("[Network IDS] Initializing distributed HIDS agents...", flush=True)

    # Initialize DB
    conn = sqlite3.connect(DB_PATH)
    conn.execute("DROP TABLE IF EXISTS incoming_alerts")
    conn.execute("CREATE TABLE incoming_alerts (id INTEGER PRIMARY KEY, ip TEXT, zone TEXT, wazuh_event TEXT, gnn_score REAL, cnn_score REAL, fused_score REAL)")
    conn.close()

    endpoints = ["attacker", "victim-user", "victim-critical", "pep"]
    threads = []

    for ep in endpoints:
        t = threading.Thread(target=run_capture, args=(ep,), daemon=True)
        t.start()
        threads.append(t)

    for t in threads:
        t.join()

if __name__ == "__main__":
    main()

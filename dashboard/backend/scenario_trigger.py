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
        "attacker_node": "attacker",
        "target_node": "victim-critical",
        "docker_cmd": "docker exec attacker nmap -sS -p 22,80,443,3306 {TARGET_IP}",
        "zone": "protected-critical",
        "wazuh_event": "port_scan_detected",
        "gnn_score": 0.95,
    },
    "2": {
        "attacker_node": "victim-user",
        "target_node": "victim-user",
        "docker_cmd": "docker exec victim-user wget -q -O /dev/null http://{TARGET_IP}/ || true",
        "zone": "protected-user",
        "wazuh_event": "unusual_traffic_burst",
        "gnn_score": 0.45,
    },
    "3": {
        "attacker_node": "victim-user",
        "target_node": "victim-critical",
        "docker_cmd": "docker exec victim-user ping -c 4 {TARGET_IP} || true",
        "zone": "protected-critical",
        "wazuh_event": "lateral_movement_detected",
        "gnn_score": 0.88,
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

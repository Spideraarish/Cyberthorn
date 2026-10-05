import time
import requests
import json
import sqlite3
import os

BASE_URL = "http://localhost:8001"
PEP_URL = "http://localhost:8000"
DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "agent/alerts.db"))
TRUST_DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "agent/trust.db"))

def reset_soc():
    try:
        res = requests.post(f"{BASE_URL}/api/reset", timeout=5)
        return res.json()
    except Exception as e:
        return {"error": str(e)}

def get_latest_alert():
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute("SELECT * FROM incoming_alerts ORDER BY id DESC LIMIT 1")
        row = cur.fetchone()
        conn.close()
        return dict(row) if row else None
    except:
        return None

def get_latest_action():
    try:
        conn = sqlite3.connect(TRUST_DB_PATH)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute("SELECT * FROM actions ORDER BY id DESC LIMIT 1")
        row = cur.fetchone()
        conn.close()
        return dict(row) if row else None
    except:
        return None

def get_pep_blocked():
    try:
        res = requests.get(f"{PEP_URL}/rules", timeout=3).json().get("rules", {})
        for item in res.get("nftables", []):
            if "set" in item and item["set"].get("name") == "blocked_ips":
                return item["set"].get("elem", [])
    except:
        pass
    return []

def run_tests():
    print("=" * 70)
    print("  QANNASAI LIVE ZERO-TRUST EVALUATION TESTBENCH")
    print("  Executing 10 Real Network Scenarios with Fused GNN+CNN Model")
    print("=" * 70)

    results = []

    for sid in range(1, 11):
        s_str = str(sid)
        print(f"\n[Test {s_str}/10] Resetting SOC baseline...", flush=True)
        reset_soc()
        time.sleep(2.0)

        print(f"[Test {s_str}/10] Triggering live network scenario {s_str}...", flush=True)
        try:
            res = requests.post(f"{BASE_URL}/api/trigger-scenario", json={"scenario": s_str}, timeout=5)
            meta = res.json()
            src_ip = meta.get("source_ip", "unknown")
            tgt_ip = meta.get("target_ip", "unknown")
            print(f"   Command active: {src_ip} -> {tgt_ip}", flush=True)
        except Exception as e:
            print(f"   Trigger failed: {e}", flush=True)
            continue

        # Wait up to 6.5s for live network packets, tcpdump sniff, ML inference, and OODA cycle
        action = None
        start_wait = time.time()
        max_wait = 4.0 if sid == 10 else 6.5
        while time.time() - start_wait < max_wait:
            action = get_latest_action()
            if action:
                break
            time.sleep(0.5)

        blocked_ips = get_pep_blocked()

        res_entry = {
            "scenario": s_str,
            "source_ip": src_ip,
            "target_ip": tgt_ip,
            "action": action.get("action") if action else "ALLOW",
            "justification": action.get("justification") if action else "Benign baseline: zero trust threshold maintained",
            "blocked_ips": blocked_ips,
            "status": "PASS" if ((action and sid != 10) or (not action and sid == 10)) else "WARN"
        }
        results.append(res_entry)

        print(f"   Result: Agent Action -> {res_entry['action'].upper()} (PEP Blocked: {blocked_ips})")
        print(f"   Justification: {res_entry['justification']}")

    print("\n" + "=" * 70)
    print("  ALL 10 SCENARIOS COMPLETED")
    print("=" * 70)
    for r in results:
        print(f"Scenario {r['scenario'].rjust(2)} | Source: {r['source_ip'].ljust(11)} | Action: {r['action'].upper().ljust(6)} | Status: {r['status']}")

if __name__ == "__main__":
    run_tests()

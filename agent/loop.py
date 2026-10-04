import time
import serial
import requests
from live_alerts import LiveAlertGenerator
from trust_store import TrustStore
from pep_client import PEPClient
from reasoning import decide

def broadcast(stage, data):
    try:
        requests.post("http://localhost:8001/api/internal/agent-stream", json={"stage": stage, "data": data}, timeout=1)
    except:
        pass

def run_loop():
    alerts_gen = LiveAlertGenerator()
    trust = TrustStore()
    pep = PEPClient()
    
    try:
        # Default Mac port for Arduino Uno, might need adjustment
        arduino = serial.Serial('/dev/cu.usbmodem14101', 9600, timeout=1)
    except Exception:
        arduino = None

    print("Starting Agentic Loop...")
    while True:
        try:
            # OBSERVE
            alerts = alerts_gen.get_new_alerts()
            if alerts:
                broadcast("OBSERVE", {"message": f"Polled for new alerts. Found {len(alerts)}."})
            else:
                # Poll silently if no alerts
                pass

            for alert in alerts:
                ip = alert['ip']
                
                # ORIENT
                current_trust = trust.get_score(ip)
                context = {
                    "ip": ip,
                    "zone": alert["zone"],
                    "gnn_score": alert["gnn_score"],
                    "wazuh_event": alert["wazuh_event"],
                    "current_trust_score": current_trust
                }
                
                print(f"\n[OBSERVE & ORIENT] Alert for {ip} targeting {alert['zone']}")
                broadcast("ORIENT", {"ip": ip, "context": context})
                
                # DECIDE
                decision = decide(context)
                action = decision.get("action")
                justification = decision.get("justification")
                print(f"[DECIDE] Action: {action} | Confidence: {decision.get('confidence')} | Justification: {justification}")
                broadcast("DECIDE", {"ip": ip, "decision": decision})
                
                # ACT
                if action == "block":
                    print(f"[ACT] Blocking IP {ip} via PEP...")
                    if arduino: arduino.write(b"block\n")
                    try:
                        pep.block(ip)
                        trust.update_score(ip, 0.0)
                    except Exception as e:
                        print(f"Failed to block {ip}: {e}")
                elif action == "watch":
                    print(f"[ACT] Watching IP {ip}, decreasing trust score...")
                    if arduino: arduino.write(b"watch\n")
                    new_trust = max(0.0, current_trust - 0.3)
                    trust.update_score(ip, new_trust)
                elif action == "ignore":
                    print(f"[ACT] Ignoring alert for {ip}.")
                    if arduino: arduino.write(b"ignore\n")
                
                broadcast("ACT", {"ip": ip, "action": action})
                
                # REFLECT
                trust.log_action(ip, action, decision.get('confidence'), justification)
                print(f"[REFLECT] Action logged for {ip}. Current trust score is now {trust.get_score(ip)}.")
                broadcast("REFLECT", {"ip": ip, "new_trust_score": trust.get_score(ip)})
        except Exception as e:
            print(f"[Agent Loop] Error during cycle: {e}")
            
        time.sleep(2)

if __name__ == "__main__":
    run_loop()

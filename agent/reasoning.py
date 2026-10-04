import json

def decide(context_json: dict, api_key: str = None) -> dict:
    """
    Evaluates the security context and returns an agentic decision.
    Output schema: {"action": "block"|"watch"|"ignore", "confidence": float, "justification": str}
    """
    gnn_score = context_json.get("gnn_score", 0)
    zone = context_json.get("zone", "")
    wazuh_event = context_json.get("wazuh_event", "")
    
    # Deterministic local fallback logic (Zero Trust rules engine)
    # This simulates the LLM reasoning without requiring an API key.
    
    if gnn_score > 0.8:
        return {
            "action": "block",
            "confidence": 0.95,
            "justification": f"CRITICAL THREAT: High GNN anomaly score ({gnn_score}) in zone '{zone}'. Immediate isolation required."
        }
    elif zone == "protected-critical" and gnn_score > 0.5:
        return {
            "action": "block",
            "confidence": 0.85,
            "justification": f"ELEVATED RISK: Moderate anomaly in critical asset zone. Enforcing Zero-Trust isolation."
        }
    elif gnn_score > 0.4:
        return {
            "action": "watch",
            "confidence": 0.70,
            "justification": f"SUSPICIOUS: Moderate anomaly ({gnn_score}) detected. Action: '{wazuh_event}'. Marking node for observation."
        }
    else:
        return {
            "action": "ignore",
            "confidence": 0.99,
            "justification": f"BENIGN: Low anomaly score ({gnn_score}) consistent with normal background traffic."
        }

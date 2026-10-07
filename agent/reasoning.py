import json

def decide(context_json: dict, api_key: str = None) -> dict:
    """
    Evaluates the security context and returns an agentic decision.
    Output schema: {"action": "block"|"watch"|"ignore", "confidence": float, "justification": str}
    """
    gnn_score = context_json.get("gnn_score", 0)
    cnn_score = context_json.get("cnn_score", 0)
    fused_score = context_json.get("fused_score", 0)
    zone = context_json.get("zone", "")
    wazuh_event = context_json.get("wazuh_event", "")
    
    # Deterministic local fallback logic (Zero Trust rules engine)
    # This simulates the LLM reasoning without requiring an API key.
    
    if wazuh_event == "insider_threat_honeytoken":
        return {
            "action": "block",
            "confidence": 1.0,
            "justification": f"INSIDER THREAT DETECTED: Decoy Honeytoken accessed by internal endpoint in zone '{zone}'."
        }
        
    if fused_score > 0.3:
        return {
            "action": "block",
            "confidence": 0.95,
            "justification": f"CRITICAL THREAT: Fused anomaly ({fused_score}) in zone '{zone}'. GNN: {gnn_score}, CNN: {cnn_score}."
        }
    elif zone == "protected-critical" and fused_score > 0.25:
        return {
            "action": "block",
            "confidence": 0.85,
            "justification": f"ELEVATED RISK: Fused anomaly in critical zone. GNN: {gnn_score}, CNN: {cnn_score}."
        }
    elif fused_score > 0.15:
        return {
            "action": "watch",
            "confidence": 0.70,
            "justification": f"SUSPICIOUS: Moderate fused anomaly ({fused_score}). Action: '{wazuh_event}'. GNN: {gnn_score}, CNN: {cnn_score}."
        }
    else:
        return {
            "action": "ignore",
            "confidence": 0.99,
            "justification": f"BENIGN: Low fused anomaly ({fused_score}). GNN: {gnn_score}, CNN: {cnn_score}."
        }

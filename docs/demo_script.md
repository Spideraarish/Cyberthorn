# QannasAI Demo Scenarios

## Scenario 1: The Port Scan (Protected-Critical)
**Action:** From the attacker container, run an aggressive nmap scan against the critical asset.
```bash
docker exec attacker nmap -sS -p- 10.0.4.10
```
**Expected Outcome:**
1. Wazuh ingests the flood of connection logs.
2. GNN spikes the anomaly score for `10.0.1.10`.
3. Agent Engine evaluates context (zone: protected-critical, high anomaly).
4. Agent decides: **BLOCK**.
5. PEP nftables rules are updated to drop `10.0.1.10`.
6. Arduino blinks and buzzes.
7. Dashboard updates live with the justification.

## Scenario 2: Unusual but Benign Burst (Protected-User)
**Action:** User workstation generates a burst of HTTP traffic (e.g. large file download).
```bash
docker exec victim-user curl -s http://10.0.5.10/[large-file]
```
**Expected Outcome:**
1. GNN flags moderate anomaly.
2. Agent evaluates context (zone: protected-user, moderate anomaly).
3. Agent decides: **WATCH**.
4. Trust score lowers, but no block is placed on the PEP.
5. Arduino lights steady LED.

## Scenario 3: Lateral Movement
**Action:** User workstation starts pinging the critical asset unexpectedly.
```bash
docker exec victim-user ping -c 5 10.0.4.10
```
**Expected Outcome:**
1. Edge between User and Critical asset appears in GNN graph.
2. GNN flags high anomaly for new edge.
3. Agent evaluates context (lateral movement).
4. Agent decides: **BLOCK**.

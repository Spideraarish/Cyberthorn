# QannasAI — Zero-Trust Attack Scenario Implementation Plan

## 1. Overview & Objectives
This document details the 10 real network traffic evaluation scenarios designed for the **QannasAI** Zero-Trust Security Operations Center. All scenarios are mapped to the **MITRE ATT&CK for Enterprise** matrix and execute live, non-destructive network interactions inside the Docker Compose sandbox (`sandbox/`).

Every scenario emits real network packets captured by the distributed endpoint IDS (`agent/network_ids.py`), parsed into network graph and flow representations, and evaluated in real-time by the fused **GNN + CNN PyTorch Model** (`ml/models/bundle.pt`).

---

## 2. MITRE ATT&CK Matrix Mapping

| # | Scenario Name | MITRE Technique | Source Node | Target Node | Traffic Profile | Expected ML Class | Expected Action |
|:--|:---|:---|:---|:---|:---|:---|:---|
| **1** | **TCP SYN Port Scan** | [T1046](https://attack.mitre.org/techniques/T1046/) Network Service Discovery | `attacker` (10.0.1.10) | `victim-critical` (10.0.4.10) | Half-open SYN probes across ports 1–100 | `scan` | **BLOCK** |
| **2** | **HTTP Request Burst** | [T1499.001](https://attack.mitre.org/techniques/T1499/001/) OS / Service Exhaustion | `attacker` (10.0.1.10) | `victim-critical` (10.0.4.10) | Rapid sequential HTTP GET requests (15 requests) | `dos` | **BLOCK** |
| **3** | **Internal Lateral Sweep** | [T1021](https://attack.mitre.org/techniques/T1021/) Remote Services / Pivot | `victim-user` (10.0.5.10) | `victim-critical` (10.0.4.10) | SYN scan across sensitive ports (21, 22, 80, 443, 3306) | `lateral` | **BLOCK** |
| **4** | **Web Directory Discovery** | [T1083](https://attack.mitre.org/techniques/T1083/) File & Directory Discovery | `attacker` (10.0.1.10) | `victim-critical` (10.0.4.10) | HTTP endpoint fuzzing probes (`/admin`, `/api`, `/config`) | `scan` | **BLOCK** |
| **5** | **SSH Connection Probing** | [T1021.004](https://attack.mitre.org/techniques/T1021/004/) Remote Services: SSH | `attacker` (10.0.1.10) | `victim-critical` (10.0.4.10) | Repeated TCP connection handshakes to port 22 | `scan` | **BLOCK** |
| **6** | **Outbound Exfiltration Flow** | [T1041](https://attack.mitre.org/techniques/T1041/) Exfiltration Over C2 | `victim-critical` (10.0.4.10) | `attacker` (10.0.1.10) | Reverse outbound POST transfer from database node | `lateral` | **BLOCK** |
| **7** | **Internal Endpoint Crawl** | [T1018](https://attack.mitre.org/techniques/T1018/) Remote System Discovery | `victim-user` (10.0.5.10) | `victim-critical` (10.0.4.10) | High-frequency internal web requests across zone boundary | `lateral` | **BLOCK** |
| **8** | **Full TCP Connect Scan** | [T1046](https://attack.mitre.org/techniques/T1046/) Network Service Discovery | `attacker` (10.0.1.10) | `victim-user` (10.0.5.10) | Full three-way handshake sweep on ports 80, 443, 8000, 8080 | `scan` | **BLOCK** |
| **9** | **Ping Sweep Reachability** | [T1018](https://attack.mitre.org/techniques/T1018/) Remote System Discovery | `attacker` (10.0.1.10) | `victim-critical` (10.0.4.10) | Rapid ICMP echo requests testing host presence | `scan` | **WATCH** / **BLOCK** |
| **10** | **Authorized Health Polling** | *Benign Baseline Validation* | `victim-user` (10.0.5.10) | `victim-critical` (10.0.4.10) | Single legitimate HTTP query testing normal operations | `normal` | **IGNORE** (No Block) |

---

## 3. Real ML Model Evaluation Pipeline

Unlike hardcoded rule engines, all anomaly metrics are derived from forward passes of `ml/models/bundle.pt`:
1. **Flow Aggregator:** `agent/network_ids.py` sniffs raw packets on interfaces (`attacker`, `victim-user`, `pep`).
2. **Feature Extractor:** `ml/features.py` builds the graph adjacency matrix, node features, and CNN packet-histogram image.
3. **Dual Model Inference:** `ml/predict.py` executes:
   - **EdgeGNN:** Evaluates topological anomaly scores and suspect graph edges.
   - **TrafficCNN:** Evaluates volumetric packet-frequency signatures.
   - **Fused Softmax:** Combines both predictions into calibrated class probabilities (`normal`, `scan`, `dos`, `lateral`).
4. **Agent Reasoning:** `agent/reasoning.py` computes Zero-Trust enforcement:
   - `fused_score > 0.3` $\rightarrow$ **BLOCK** (PEP isolates IP via `nftables`).
   - `fused_score > 0.15` $\rightarrow$ **WATCH** (Decreases trust score, flags node in UI).
   - `fused_score <= 0.15` $\rightarrow$ **IGNORE** (Maintains trust score for normal baseline traffic).

---

## 4. Test Execution & Validation Loop
The automated verification script `test_all_scenarios.py` loops through each scenario:
1. Resets the Policy Enforcement Point (clears `nftables` sets, flushes databases).
2. Triggers the live Docker network command.
3. Awaits packet capture and model inference.
4. Asserts that the ML model produces real, non-zero GNN and CNN scores.
5. Verifies that the Agentic OODA loop logs the event and updates the firewall state accordingly.

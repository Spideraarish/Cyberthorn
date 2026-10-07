"""predict.py : the deliverable from plan 5.8.   predict(window_flows) -> dict in the contract 3.2 format.

    from predict import predict
    out = predict(list_of_flow_dicts)        # flow dicts as in contract 3.1
"""
import os, time
import numpy as np
import pandas as pd
import torch

import features as FT
import models as MD

_HERE = os.path.dirname(os.path.abspath(__file__))
_CACHE = {}


def _load(path=None):
    path = path or os.path.join(_HERE, "models", "bundle.pt")
    if path in _CACHE:
        return _CACHE[path]
    b = torch.load(path, map_location="cpu", weights_only=False)
    gnn = MD.EdgeGNN(len(FT.NODE_FEATS), FT.EDGE_DIM, b["hid"], len(b["classes"]))
    gnn.load_state_dict(b["gnn_state"]); gnn.eval()
    cnn = MD.TrafficCNN(len(b["classes"]))
    cnn.load_state_dict(b["cnn_state"]); cnn.eval()
    for k in ["n_mu", "n_sd", "e_mu", "e_sd", "cnn_max"]:
        b[k] = np.asarray(b[k], dtype=np.float32)
    _CACHE[path] = (b, gnn, cnn)
    return _CACHE[path]


def _normal_output(window_id, ts, classes):
    z = {c: (1.0 if c == "normal" else 0.0) for c in classes}
    return dict(window_id=window_id, ts=ts, gnn_probs=z, cnn_probs=dict(z), fused_probs=dict(z),
                label="normal", confidence=1.0, suspect_edges=[])


def predict(window_flows, window_id=0, ts=None, bundle_path=None, max_suspects=5):
    b, gnn, cnn = _load(bundle_path)
    classes = b["classes"]
    df = pd.DataFrame(window_flows)
    if ts is None:
        ts = float(df["ts"].max()) if len(df) and "ts" in df else time.time()
    if len(df) == 0:
        return _normal_output(window_id, ts, classes)
    defaults = dict(src_port=0, dst_port=0, proto="other", duration=0.0, fwd_pkts=0, bwd_pkts=0,
                    fwd_bytes=0, bwd_bytes=0, flags="INT")
    for c, v in defaults.items():
        if c not in df:
            df[c] = v
    g = FT.build_graph(df)

    x = torch.from_numpy((g["node_x"] - b["n_mu"]) / b["n_sd"]).float()
    ea = torch.from_numpy((g["edge_attr"] - b["e_mu"]) / b["e_sd"]).float()
    ei = torch.from_numpy(g["edge_index"])
    with torch.no_grad():
        P = torch.softmax(gnn(x, ei, ea), 1).numpy()
        img = torch.from_numpy(g["cnn"] / b["cnn_max"][:, None, None]).float().unsqueeze(0)
        pc = torch.softmax(cnn(img), 1)[0].numpy()
    pg = FT.agg_window_probs(P, b["agg_k"])
    w = b["w_fuse"]
    pf = w * pg + (1 - w) * pc
    k = int(pf.argmax())

    score = 1.0 - P[:, 0]
    best = {}
    for (si, di), sc in zip(g["edge_index"].T, score):
        key = (str(g["ips"][si]), str(g["ips"][di]))
        best[key] = max(best.get(key, 0.0), float(sc))
    sus = sorted(best.items(), key=lambda kv: -kv[1])
    sus = [dict(src=a, dst=c, score=round(s, 4)) for (a, c), s in sus if s >= 0.5][:max_suspects]

    as_dict = lambda v: {c: round(float(p), 4) for c, p in zip(classes, v)}
    return dict(window_id=window_id, ts=ts, gnn_probs=as_dict(pg), cnn_probs=as_dict(pc),
                fused_probs=as_dict(pf), label=classes[k], confidence=round(float(pf[k]), 4),
                suspect_edges=sus)

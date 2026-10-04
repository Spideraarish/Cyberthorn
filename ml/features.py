"""features.py : single source of truth for feature building (training AND live inference).

Flow record contract (plan section 3.1):
  ts, src_ip, dst_ip, src_port, dst_port, proto, duration,
  fwd_pkts, bwd_pkts, fwd_bytes, bwd_bytes, flags
"""
import zlib
import numpy as np
import pandas as pd

CLASSES = ["normal", "scan", "dos", "lateral"]
PROTOS = ["tcp", "udp", "icmp", "other"]
STATES = ["FIN", "CON", "INT", "REQ", "RST", "other"]
NODE_FEATS = ["in_deg", "out_deg", "uniq_dports", "uniq_peers", "bytes_in", "bytes_out", "mean_dur"]
EDGE_DIM = 7 + len(PROTOS) + len(STATES)      # 17
CNN_SIZE = 32
REQUIRED = ["src_ip", "dst_ip", "src_port", "dst_port", "proto", "duration",
            "fwd_pkts", "bwd_pkts", "fwd_bytes", "bwd_bytes", "flags"]
_OTHER_STATES = {"ACC", "CLO", "ECO", "ECR", "PAR", "TST", "URH", "URN", "MAS", "TXD", "no", "-", ""}


def norm_state(f):
    """Dataset 'state' (FIN, CON, INT, REQ, RST, ...) or a raw TCP flag string (e.g. 'SA') -> one of STATES.
    The TCP-flag branch is a heuristic: make sure Aarish's collector produces something sensible."""
    f = str(f)
    if f in STATES:
        return f
    if f in _OTHER_STATES:
        return "other"
    u = f.upper()
    if "R" in u:
        return "RST"
    if "F" in u:
        return "FIN"
    if "S" in u and "A" in u:
        return "CON"
    if "S" in u:
        return "REQ"
    return "INT"


def edge_features(df):
    """(E, 17) float32. log1p of magnitudes, protocol one-hot, connection-state one-hot."""
    num = [np.log1p(np.clip(df[c].to_numpy(dtype=np.float64), 0, None))
           for c in ["duration", "fwd_pkts", "bwd_pkts", "fwd_bytes", "bwd_bytes", "src_port", "dst_port"]]
    pr = df["proto"].astype(str).str.lower().to_numpy()
    pr = np.where(np.isin(pr, PROTOS[:3]), pr, "other")
    po = np.stack([pr == p for p in PROTOS], 1).astype(np.float64)
    st = np.array([norm_state(x) for x in df["flags"].to_numpy()])
    so = np.stack([st == s for s in STATES], 1).astype(np.float64)
    return np.concatenate([np.stack(num, 1), po, so], 1).astype(np.float32)


def node_features(s, d, df, n):
    """(N, 7) float32 per-IP features: degrees, unique dst ports / peers contacted, bytes in/out, mean duration."""
    out_deg = np.bincount(s, minlength=n).astype(np.float64)
    in_deg = np.bincount(d, minlength=n).astype(np.float64)
    dport = np.clip(df["dst_port"].to_numpy(dtype=np.int64), 0, 65535)
    u = np.unique(s.astype(np.int64) * 70000 + dport)
    uniq_dports = np.bincount(u // 70000, minlength=n).astype(np.float64)
    u = np.unique(s.astype(np.int64) * n + d)
    uniq_peers = np.bincount(u // n, minlength=n).astype(np.float64)
    fb = df["fwd_bytes"].to_numpy(dtype=np.float64)
    bb = df["bwd_bytes"].to_numpy(dtype=np.float64)
    bytes_out = np.bincount(s, weights=fb, minlength=n) + np.bincount(d, weights=bb, minlength=n)
    bytes_in = np.bincount(s, weights=bb, minlength=n) + np.bincount(d, weights=fb, minlength=n)
    dur = df["duration"].to_numpy(dtype=np.float64)
    inc = np.bincount(s, weights=dur, minlength=n) + np.bincount(d, weights=dur, minlength=n)
    mean_dur = inc / np.maximum(in_deg + out_deg, 1)
    x = np.stack([in_deg, out_deg, uniq_dports, uniq_peers, bytes_in, bytes_out, mean_dur], 1)
    return np.log1p(np.clip(x, 0, None)).astype(np.float32)


def _bucket(ip):
    return zlib.crc32(str(ip).encode()) % CNN_SIZE      # deterministic (python hash() is not)


def cnn_tensor(s, d, df, ips):
    """(3, 32, 32): src-bucket x dst-bucket matrices of bytes, packets, unique dst ports (log1p)."""
    S = CNN_SIZE
    bk = np.array([_bucket(i) for i in ips])
    sb, db = bk[s], bk[d]
    by = df["fwd_bytes"].to_numpy(dtype=np.float64) + df["bwd_bytes"].to_numpy(dtype=np.float64)
    pk = df["fwd_pkts"].to_numpy(dtype=np.float64) + df["bwd_pkts"].to_numpy(dtype=np.float64)
    dport = np.clip(df["dst_port"].to_numpy(dtype=np.int64), 0, 65535)
    t = np.zeros((3, S * S), dtype=np.float64)
    cell = sb * S + db
    np.add.at(t[0], cell, by)
    np.add.at(t[1], cell, pk)
    u = np.unique(cell.astype(np.int64) * 70000 + dport)
    np.add.at(t[2], u // 70000, 1.0)
    return np.log1p(t).reshape(3, S, S).astype(np.float32)


def build_graph(df):
    """One window of flows (DataFrame with REQUIRED columns) -> dict of numpy arrays."""
    src = df["src_ip"].astype(str).to_numpy()
    dst = df["dst_ip"].astype(str).to_numpy()
    E = len(df)
    ips, inv = np.unique(np.concatenate([src, dst]), return_inverse=True)
    s, d = inv[:E], inv[E:]
    return dict(
        ips=ips,
        edge_index=np.stack([s, d]).astype(np.int64),
        edge_attr=edge_features(df),
        node_x=node_features(s, d, df, len(ips)),
        cnn=cnn_tensor(s, d, df, ips),
    )


def agg_window_probs(P, k=10):
    """Edge probabilities (E, C) -> one window probability vector (C,).
    Attack class c: mean of the top-k edge probabilities for c (the most suspicious edges decide).
    Normal: 1 - strongest attack score. Then normalised to sum to 1."""
    k = max(1, min(k, len(P)))
    out = np.zeros(P.shape[1])
    for c in range(1, P.shape[1]):
        out[c] = np.sort(P[:, c])[-k:].mean()
    out[0] = max(1.0 - out[1:].max(), 1e-6)
    return out / out.sum()

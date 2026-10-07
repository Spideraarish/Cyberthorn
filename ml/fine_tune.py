import os
import json
import torch
import torch.nn as nn
import torch.optim as optim
import features as FT
import models as MD
import numpy as np

BUNDLE_PATH = os.path.join(os.path.dirname(__file__), "models", "bundle.pt")
LIVE_DATA_PATH = os.path.join(os.path.dirname(__file__), "live_flows.jsonl")

def log_live_flow(flows, true_label):
    """
    Called by network_ids.py when a scenario is triggered to save 
    the raw flows and their ground-truth label for fine-tuning.
    """
    record = {"label": true_label, "flows": flows}
    with open(LIVE_DATA_PATH, "a") as f:
        f.write(json.dumps(record) + "\n")

def fine_tune_models(epochs=10, lr=1e-4):
    """
    Loads the live captured flows, converts them to graphs, 
    and fine-tunes the EdgeGNN and TrafficCNN.
    """
    if not os.path.exists(LIVE_DATA_PATH):
        print(f"No live data found at {LIVE_DATA_PATH}. Run scenarios first!")
        return

    print("Loading bundle.pt for fine-tuning...")
    b = torch.load(BUNDLE_PATH, map_location="cpu", weights_only=False)
    
    gnn = MD.EdgeGNN(len(FT.NODE_FEATS), FT.EDGE_DIM, b["hid"], len(b["classes"]))
    gnn.load_state_dict(b["gnn_state"])
    
    cnn = MD.TrafficCNN(len(b["classes"]))
    cnn.load_state_dict(b["cnn_state"])

    gnn.train()
    cnn.train()

    optimizer_gnn = optim.Adam(gnn.parameters(), lr=lr)
    optimizer_cnn = optim.Adam(cnn.parameters(), lr=lr)
    criterion = nn.CrossEntropyLoss()

    print("Loading and preprocessing live flows...")
    graphs = []
    labels = []
    
    classes = b["classes"]
    
    with open(LIVE_DATA_PATH, "r") as f:
        for line in f:
            data = json.loads(line)
            flows = data["flows"]
            label_str = data["label"]
            
            if label_str not in classes:
                continue
                
            label_idx = classes.index(label_str)
            
            # Convert raw flows to graph features using the existing pipeline
            import pandas as pd
            df = pd.DataFrame(flows)
            g = FT.build_graph(df)
            
            # Normalize inputs using bundle statistics
            x = torch.from_numpy((g["node_x"] - b["n_mu"]) / b["n_sd"]).float()
            ea = torch.from_numpy((g["edge_attr"] - b["e_mu"]) / b["e_sd"]).float()
            ei = torch.from_numpy(g["edge_index"])
            cnn_max_arr = np.array(b["cnn_max"])
            img = torch.from_numpy(g["cnn"] / cnn_max_arr[:, None, None]).float().unsqueeze(0)
            
            graphs.append((x, ei, ea, img))
            labels.append(label_idx)

    if not graphs:
        print("No valid graphs generated for fine-tuning.")
        return

    print(f"Starting Transfer Learning on {len(graphs)} live lab samples...")
    for epoch in range(epochs):
        total_loss_gnn = 0
        total_loss_cnn = 0
        
        for i in range(len(graphs)):
            x, ei, ea, img = graphs[i]
            y = torch.tensor([labels[i]], dtype=torch.long)
            
            # Train GNN
            optimizer_gnn.zero_grad()
            out_gnn = gnn(x, ei, ea)
            # EdgeGNN predicts per-edge, but we want a window-level loss for simplicity 
            # here we take the mean prediction across all edges
            window_pred_gnn = out_gnn.mean(dim=0, keepdim=True)
            loss_gnn = criterion(window_pred_gnn, y)
            loss_gnn.backward()
            optimizer_gnn.step()
            total_loss_gnn += loss_gnn.item()
            
            # Train CNN
            optimizer_cnn.zero_grad()
            out_cnn = cnn(img)
            loss_cnn = criterion(out_cnn, y)
            loss_cnn.backward()
            optimizer_cnn.step()
            total_loss_cnn += loss_cnn.item()
            
        print(f"Epoch {epoch+1}/{epochs} | GNN Loss: {total_loss_gnn:.4f} | CNN Loss: {total_loss_cnn:.4f}")

    print("Saving fine-tuned weights back to bundle.pt...")
    b["gnn_state"] = gnn.state_dict()
    b["cnn_state"] = cnn.state_dict()
    # We can also increase the GNN fusion weight now that it's fine-tuned!
    b["w_fuse"] = 0.50 
    
    torch.save(b, BUNDLE_PATH)
    print("Fine-tuning complete! Plan 5.7 successfully implemented.")

if __name__ == "__main__":
    fine_tune_models()

import torch
from model import GraphAnomalyModel
from graph_builder import build_graph

def infer(node_features, edges, edge_features):
    model = GraphAnomalyModel(in_channels=2, hidden_channels=16, out_channels=1)
    try:
        model.load_state_dict(torch.load("model.pth"))
    except FileNotFoundError:
        print("Model not found. Please run train.py first.")
        return None
        
    model.eval()
    data = build_graph(edges, edge_features, node_features)
    with torch.no_grad():
        out = model(data.x, data.edge_index)
    
    return out.numpy()

if __name__ == "__main__":
    node_features = [
        [1.0, 50.0],
        [1.0, 10.0],
        [0.0, 0.0]
    ]
    edges = [
        [2, 0], [2, 0], [2, 0], [2, 0]
    ]
    edge_features = [
        [10, 80], [10, 443], [10, 22], [10, 3389]
    ]
    scores = infer(node_features, edges, edge_features)
    if scores is not None:
        print("Anomaly scores for nodes:")
        for i, score in enumerate(scores):
            print(f"Node {i}: {score[0]:.4f}")

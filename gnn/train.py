import torch
import torch.nn as nn
from model import GraphAnomalyModel
from graph_builder import build_graph

def train_model():
    print("Training GNN on baseline traffic...")
    
    node_features = [
        [1.0, 50.0],
        [1.0, 10.0],
        [0.0, 0.0]
    ]
    
    edges = [
        [0, 1], [1, 0],
        [2, 0], [0, 1]
    ]
    
    edge_features = [
        [100, 80], [200, 80],
        [50, 22], [50, 22]
    ]
    
    data = build_graph(edges, edge_features, node_features)
    labels = torch.tensor([[0.0], [0.0], [1.0]], dtype=torch.float)
    
    model = GraphAnomalyModel(in_channels=2, hidden_channels=16, out_channels=1)
    optimizer = torch.optim.Adam(model.parameters(), lr=0.01)
    criterion = nn.BCELoss()
    
    model.train()
    for epoch in range(50):
        optimizer.zero_grad()
        out = model(data.x, data.edge_index)
        loss = criterion(out, labels)
        loss.backward()
        optimizer.step()
        if epoch % 10 == 0:
            print(f"Epoch {epoch}, Loss: {loss.item():.4f}")
            
    print("Training complete. Saving model...")
    torch.save(model.state_dict(), "model.pth")

if __name__ == "__main__":
    train_model()

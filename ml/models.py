"""models.py : the two networks from plan sections 5.4 and 5.5."""
import torch
import torch.nn as nn
import torch.nn.functional as Fn
from torch_geometric.nn import SAGEConv


class EdgeGNN(nn.Module):
    """GraphSAGE node encoder + MLP edge head. Messages flow both ways along each flow,
    so a scanner's embedding also sees the hosts it probed."""
    def __init__(self, node_in, edge_in, hid=64, n_cls=4):
        super().__init__()
        self.c1 = SAGEConv(node_in, hid)
        self.c2 = SAGEConv(hid, hid)
        self.head = nn.Sequential(
            nn.Linear(hid * 2 + edge_in, hid), nn.ReLU(), nn.Dropout(0.2),
            nn.Linear(hid, n_cls))

    def forward(self, x, ei, ea):
        ei_mp = torch.cat([ei, ei.flip(0)], dim=1)
        h = Fn.relu(self.c1(x, ei_mp))
        h = Fn.relu(self.c2(h, ei_mp))
        z = torch.cat([h[ei[0]], h[ei[1]], ea], dim=1)
        return self.head(z)


class TrafficCNN(nn.Module):
    def __init__(self, n_cls=4):
        super().__init__()
        self.net = nn.Sequential(
            nn.Conv2d(3, 16, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2),
            nn.Conv2d(16, 32, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2),
            nn.Conv2d(32, 64, 3, padding=1), nn.ReLU(), nn.AdaptiveAvgPool2d(1),
            nn.Flatten(), nn.Linear(64, n_cls))

    def forward(self, x):
        return self.net(x)

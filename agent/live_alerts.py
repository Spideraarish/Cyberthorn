import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'alerts.db')

class LiveAlertGenerator:
    def __init__(self):
        # Ensure DB exists
        if not os.path.exists(DB_PATH):
            conn = sqlite3.connect(DB_PATH)
            conn.execute("CREATE TABLE incoming_alerts (id INTEGER PRIMARY KEY, ip TEXT, zone TEXT, wazuh_event TEXT, gnn_score REAL, cnn_score REAL, fused_score REAL)")
            conn.commit()
            conn.close()

    def get_new_alerts(self):
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM incoming_alerts")
        rows = cursor.fetchall()
        
        alerts = []
        for row in rows:
            alerts.append(dict(row))
            cursor.execute("DELETE FROM incoming_alerts WHERE id = ?", (row['id'],))
            
        conn.commit()
        conn.close()
        
        return alerts

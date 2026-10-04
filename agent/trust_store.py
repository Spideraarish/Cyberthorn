import sqlite3
import os

DEFAULT_TRUST_DB = os.path.join(os.path.dirname(__file__), 'trust.db')

class TrustStore:
    def __init__(self, db_path=None):
        if db_path is None:
            db_path = DEFAULT_TRUST_DB
        self.conn = sqlite3.connect(db_path)
        self.cursor = self.conn.cursor()
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS trust_scores (
                ip TEXT PRIMARY KEY,
                score REAL
            )
        ''')
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS actions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp REAL,
                ip TEXT,
                action TEXT,
                confidence REAL,
                justification TEXT
            )
        ''')
        self.conn.commit()

    def get_score(self, ip):
        self.cursor.execute("SELECT score FROM trust_scores WHERE ip=?", (ip,))
        row = self.cursor.fetchone()
        if row is None:
            # Default trust score
            self.cursor.execute("INSERT INTO trust_scores (ip, score) VALUES (?, ?)", (ip, 1.0))
            self.conn.commit()
            return 1.0
        return row[0]

    def update_score(self, ip, new_score):
        self.cursor.execute("UPDATE trust_scores SET score=? WHERE ip=?", (new_score, ip))
        self.conn.commit()

    def log_action(self, ip, action, confidence, justification):
        import time
        self.cursor.execute("INSERT INTO actions (timestamp, ip, action, confidence, justification) VALUES (?, ?, ?, ?, ?)", (time.time(), ip, action, confidence, justification))
        self.conn.commit()

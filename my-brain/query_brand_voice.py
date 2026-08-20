import os
import sqlite3

db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'brain.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()
cursor.execute('SELECT * FROM brand_voice')
rows = cursor.fetchall()

for row in rows:
    print(row)

conn.close()

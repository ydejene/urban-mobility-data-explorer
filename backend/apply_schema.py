# backend/apply_schema.py
# Database initialization script - applies schema to create all tables

import sqlite3
import os

# Paths relative to backend folder (database is one level up)
schema_path = os.path.join('..', 'database', 'schema.sql')
db_path = os.path.join('..', 'database', 'taxi_data.db')

# Read the schema file
with open(schema_path, 'r') as f:
    schema_sql = f.read()

# Connect to database and execute schema
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    cursor.executescript(schema_sql)
    conn.commit()
    print("✓ Database schema applied successfully!")
    print(f"✓ Database created at: {db_path}")
    
    # Verify tables were created
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    print(f"✓ Created {len(tables)} tables:")
    for table in tables:
        print(f"  - {table[0]}")
        
except Exception as e:
    print(f"✗ Error applying schema: {e}")
    
finally:
    conn.close()
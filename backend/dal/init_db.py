import sqlite3
import os

def init_db():
    try:
        # Define paths
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        db_path = os.path.join(base_dir, 'database', 'taxi_data.db')
        schema_path = os.path.join(base_dir, 'database', 'schema.sql')

        print(f"Initializing SQLite database at: {db_path}")

        # Ensure database directory exists
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
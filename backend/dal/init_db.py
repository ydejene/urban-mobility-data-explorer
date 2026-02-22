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

        # Connect to SQLite
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()

        # Read and execute schema.sql
        print(f"Executing schema from: {schema_path}")
        with open(schema_path, 'r') as f:
            cur.executescript(f.read())

        conn.commit()
        print("Success! SQLite database initialized and tables created.")

        cur.close()
        conn.close()

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    init_db()
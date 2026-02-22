import sqlite3
import os
import time

class TripAggregator:
    """Business Logic Layer: Handles complex data aggregations"""
    
    @staticmethod
    def get_global_summary(filters):
        db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'database', 'taxi_data.db')
        conn = sqlite3.connect(db_path)

        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA synchronous=NORMAL")
        cur = conn.cursor()
        
        try:
            # 1. Map locations to boroughs 
            cur.execute("SELECT location_id, borough FROM taxi_zones")
            loc_to_borough = {r[0]: r[1] for r in cur.fetchall()}
            
            selected_borough = filters.get('borough') if filters.get('borough') != 'all' else None
            start_date = filters.get('start_date')
            end_date = filters.get('end_date')
            
            # 2. Base Query: Group by location_id FIRST
            where_clauses = []
            params = []
            
            if start_date:
                where_clauses.append("pickup_date >= ?")
                params.append(start_date)
            if end_date:
                where_clauses.append("pickup_date <= ?")
                params.append(end_date)
            if filters.get('zone_id'):
                where_clauses.append("pickup_location_id = ?")
                params.append(filters['zone_id'])
                
            where_str = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else "" if where_clauses else ""
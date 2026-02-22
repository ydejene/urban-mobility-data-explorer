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

                        
            query = f"""
                SELECT 
                    pickup_location_id,
                    COUNT(*) as trip_count,
                    COALESCE(SUM(fare_amount), 0) as total_fare,
                    COALESCE(SUM(total_amount), 0) as total_rev,
                    COALESCE(SUM(trip_distance), 0) as total_dist,
                COALESCE(SUM(speed_mph), 0) as total_speed,
                COALESCE(SUM(passenger_count), 0) as total_pass,
                COALESCE(SUM(CASE WHEN speed_mph > 80 THEN 1 ELSE 0 END), 0) as speed_anomalies,
                    COALESCE(SUM(CASE WHEN trip_distance < 1 AND fare_amount > 100 THEN 1 ELSE 0 END), 0) as fare_anomalies,
                    COALESCE(SUM(CASE WHEN speed_mph <= 80 THEN speed_mph ELSE 0 END), 0) as f_speed_sum,
                    COALESCE(SUM(CASE WHEN speed_mph <= 80 THEN 1 ELSE 0 END), 0) as f_speed_count
                FROM trips
                {where_str}
                GROUP BY 1
            """
            
            cur.execute(query, params)
            rows = cur.fetchall()
            
            # 3. Post-Aggregation
            borough_data = {}
            for r in rows:
                loc_id, count, fare, rev, dist, speed, pass_count, speed_anom, fare_anom, f_sum, f_count = r
                b_name = loc_to_borough.get(loc_id, 'Other')
                
                if b_name not in borough_data:
                    borough_data[b_name] = {
                        "trips": 0, "fare": 0, "rev": 0, "dist": 0, 
                        "speed": 0, "pass": 0, "speed_anom": 0, "fare_anom": 0, "f_sum": 0, "f_count": 0
                    }
                
                s = borough_data[b_name]
                s['trips'] += count
                s['fare'] += fare
                s['rev'] += rev
                s['dist'] += dist
                s['speed'] += speed
                s['pass'] += pass_count
                s['speed_anom'] += speed_anom
                s['fare_anom'] += fare_anom
                s['f_sum'] += f_sum
                s['f_count'] += f_count        

  
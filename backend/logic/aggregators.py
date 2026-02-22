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

                
            # Final Calculations
            global_trips = 0
            global_fare = 0
            global_rev = 0
            global_dist = 0
            global_speed_sum = 0
            global_passengers = 0
            global_speed_anom = 0
            global_fare_anom = 0
            global_f_sum = 0
            global_f_count = 0
            choke_points = 0
        
            congestion_index = {}

            for b_name, s in borough_data.items():
                avg_b_speed = s['f_sum'] / max(s['f_count'], 1)
                congestion_index[b_name] = round(20 / avg_b_speed, 2) if avg_b_speed > 0 else 0
                
                if not selected_borough or b_name == selected_borough:
                    global_trips += s['trips']
                    global_fare += s['fare']
                    global_rev += s['rev']
                    global_dist += s['dist']
                    global_speed_sum += s['speed']
                    global_passengers += s['pass']
                    global_speed_anom += s['speed_anom']
                    global_fare_anom += s['fare_anom']
                    global_f_sum += s['f_sum']
                    global_f_count += s['f_count']
            
            # Choke points calculated from the already grouped data
            for loc_id, r in zip(loc_to_borough.keys(), rows):
                avg_loc_speed = r[5] / max(r[1], 1)
                if 0 < avg_loc_speed < 4.5:
                    choke_points += 1

            reliability_score = round(((global_trips - (global_speed_anom + global_fare_anom)) / max(global_trips, 1)) * 100, 4)
            
            return {
                "summary": {
                    "totalTrips": global_trips,
                    "totalPassengers": global_passengers,
                    "avgFare": round(global_fare / max(global_trips, 1), 2) if global_trips > 0 else 0,
                    "totalRevenue": round(global_rev, 2),
                    "avgDistance": round(global_dist / max(global_trips, 1), 2) if global_trips > 0 else 0,
                    "avgSpeed": round(global_speed_sum / max(global_trips, 1), 2) if global_trips > 0 else 0,
                    "systemHealth": reliability_score,
                    "avgMobilitySpeed": round(global_f_sum / max(global_f_count, 1), 1) if global_f_count > 0 else 0,
                    "totalAnomalies": global_speed_anom + global_fare_anom,
                    "activeChokePoints": choke_points,
                    "anomalyDetails": {
                        "speed": global_speed_anom,
                        "fare": global_fare_anom
                    }
                },
                "congestion": congestion_index
            }
        finally:
            conn.close() 
 
    @staticmethod
    def get_hourly_stats(filters):
        """Calculates volume and speed per hour for Rush Hour identification"""
        db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'database', 'taxi_data.db')
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        try:
            start_date = filters.get('start_date')
            end_date = filters.get('end_date')
            borough = filters.get('borough')
            zone_id = filters.get('zone_id')
            
            where_clauses = []
            params = []
            join_str = ""
            
            if start_date:
                where_clauses.append("pickup_date >= ?")
                params.append(start_date)
            if end_date:
                where_clauses.append("pickup_date <= ?")
                params.append(end_date)
            
            # Spatial Filtering
            if zone_id:
                where_clauses.append("pickup_location_id = ?")
                params.append(zone_id)
            elif borough and borough != 'all':
                join_str = "JOIN taxi_zones z ON trips.pickup_location_id = z.location_id"
                where_clauses.append("z.borough = ?")
                params.append(borough)

            where_str = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else "" if where_clauses else ""
            
            query = f"""
                SELECT 
                    pickup_hour,
                    COUNT(*) as trip_count,
                    AVG(speed_mph) as avg_speed
                FROM trips
                {join_str}
                {where_str}
                GROUP BY pickup_hour
                ORDER BY pickup_hour ASC
            """
            cur.execute(query, params)
            rows = cur.fetchall()
            
            # Ensure all 24 hours are present
            hourly_data = {h: {"trips": 0, "speed": 0} for h in range(24)}
            for r in rows:
                hour, count, speed = r
                hourly_data[hour] = {"trips": count, "speed": round(speed or 0, 2)}
            
            return hourly_data
        finally:
            conn.close()

    @staticmethod
    def get_congestion_index():
        """Legacy - now handled by get_global_summary to save scans"""
        return {}
  
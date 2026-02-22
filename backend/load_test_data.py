import sqlite3
import json
from datetime import datetime, timedelta

conn = sqlite3.connect('database/taxi_data.db')
cursor = conn.cursor()

print("Loading zones...")
zones = [
    (1, "Manhattan", "Financial District", "Yellow Zone", json.dumps({"type": "Polygon", "coordinates": [[[-74.0141, 40.7074], [-74.0050, 40.7074], [-74.0050, 40.7010], [-74.0141, 40.7010], [-74.0141, 40.7074]]]})),
    (2, "Manhattan", "Midtown", "Yellow Zone", json.dumps({"type": "Polygon", "coordinates": [[[-73.9885, 40.7589], [-73.9785, 40.7589], [-73.9785, 40.7489], [-73.9885, 40.7489], [-73.9885, 40.7589]]]})),
    (3, "Brooklyn", "Williamsburg", "Boro Zone", json.dumps({"type": "Polygon", "coordinates": [[[-73.9635, 40.7181], [-73.9535, 40.7181], [-73.9535, 40.7081], [-73.9635, 40.7081], [-73.9635, 40.7181]]]})),
    (4, "Queens", "Astoria", "Boro Zone", json.dumps({"type": "Polygon", "coordinates": [[[-73.9282, 40.7644], [-73.9182, 40.7644], [-73.9182, 40.7544], [-73.9282, 40.7544], [-73.9282, 40.7644]]]}))]

for z in zones:
    cursor.execute('INSERT OR REPLACE INTO taxi_zones VALUES (?, ?, ?, ?, ?)', z)

print(f"✓ {len(zones)} zones loaded")
print("Loading trips...")

trips = []
base = datetime(2019, 1, 5, 8, 0)

for i in range(150):
    dist = 2.5 + (i % 10) * 0.8
    fare = 10 + dist * 2.5
    hour = (8 + i // 10) % 24
    
    # Match the actual schema columns
    trip = (
        1,  # vendor_id
        1 + (i % 3),  # passenger_count
        round(dist, 2),  # trip_distance
        1,  # rate_code_id
        1,  # payment_type_id
        round(fare, 2),  # fare_amount
        0.5,  # extra
        0.5,  # mta_tax
        round(fare * 0.15, 2),  # tip_amount
        1 + (i % 4),  # pickup_location_id
        1 + ((i + 1) % 4),  # dropoff_location_id
        0,  # tolls_amount
        0.3,  # improvement_surcharge
        round(fare * 1.2, 2),  # total_amount
        2.75,  # congestion_surcharge
        None,  # pickup_time_id
        None,  # dropoff_time_id
        round(15 + (i % 20), 2),  # speed_mph
        round((fare * 1.2) / dist, 2),  # fare_per_mile
        int((dist / 15) * 3600),  # trip_duration_seconds
        base.date().isoformat(),  # pickup_date
        hour,  # pickup_hour
        'N'  # store_and_fwd_flag
    )
    trips.append(trip)

cursor.executemany('''INSERT INTO trips (
    vendor_id, passenger_count, trip_distance, rate_code_id, payment_type_id,
    fare_amount, extra, mta_tax, tip_amount, pickup_location_id, dropoff_location_id,
    tolls_amount, improvement_surcharge, total_amount, congestion_surcharge,
    pickup_time_id, dropoff_time_id, speed_mph, fare_per_mile, trip_duration_seconds,
    pickup_date, pickup_hour, store_and_fwd_flag
) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)''', trips)

print(f"✓ {len(trips)} trips loaded")
conn.commit()
conn.close()
print("\n🎉 DONE! Refresh your dashboard NOW!")
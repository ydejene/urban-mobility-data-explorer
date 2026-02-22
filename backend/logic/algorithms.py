import pandas as pd
import numpy as np

class AnomalyDetector:
    
    @staticmethod
    def quick_sort_zones(arr, key='score'):
        if len(arr) <= 1:
            return arr
        
        pivot = arr[len(arr) // 2]
        left = [x for x in arr if x[key] > pivot[key]] 
        middle = [x for x in arr if x[key] == pivot[key]]
        right = [x for x in arr if x[key] < pivot[key]]
        
        return AnomalyDetector.quick_sort_zones(left, key) + middle + AnomalyDetector.quick_sort_zones(right, key)
    
    @staticmethod
    def detect_choke_points(trips_df, speed_threshold=4.5):
        zone_speeds = trips_df.groupby('pickup_location_id')['speed_mph'].mean()
        choke_points = zone_speeds[zone_speeds < speed_threshold]
        return choke_points
    
    @staticmethod
    def detect_speed_anomalies(trips_df, threshold_mph=80):
        anomalies = trips_df[trips_df['speed_mph'] > threshold_mph]
        return anomalies

    @staticmethod
    def detect_fare_anomalies(trips_df):
        anomalies = trips_df[(trips_df['trip_distance'] < 1) & (trips_df['fare_amount'] > 100)]
        return anomalies
    
    @staticmethod
    def identify_coverage_gaps(trips_df):
        pu_counts = trips_df['pickup_location_id'].value_counts()
        do_counts = trips_df['dropoff_location_id'].value_counts()
        
        gaps = []
        for loc_id in do_counts.index:
            pu = pu_counts.get(loc_id, 0)
            do = do_counts[loc_id]
            if pu > 0:
                ratio = do / pu
                if ratio > 2.0: 
                    gaps.append({"location_id": int(loc_id), "gap_ratio": round(ratio, 2)})
        
        return AnomalyDetector.quick_sort_zones(gaps, key='gap_ratio')[:10]
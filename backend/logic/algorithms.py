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
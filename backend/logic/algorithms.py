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
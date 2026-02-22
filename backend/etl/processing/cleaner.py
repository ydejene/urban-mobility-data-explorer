import pandas as pd
import numpy as np
import logging

logger = logging.getLogger("DataCleaner")

class DataCleaner:
    """Handles data quality and cleaning steps"""
    
    @staticmethod
    def clean_trip_data(df):
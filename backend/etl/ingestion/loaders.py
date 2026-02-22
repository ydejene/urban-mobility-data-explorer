# backend\etl\ingestion\loaders.py
# Data Ingestion Module: Provides classes for loading taxi trip data from CSV and spatial metadata from Shapefiles.

import pandas as pd
import os
import shapefile # pyshp
import json

class DataLoader:
    """Base class for data ingestion"""
    def __init__(self, file_path):
        self.file_path = file_path

    def load(self):
        raise NotImplementedError("Subclasses must implement load()")

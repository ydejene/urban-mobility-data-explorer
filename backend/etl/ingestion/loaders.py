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

class CSVLoader(DataLoader):
    """Loads raw trip data or lookup tables from CSV"""
    def load(self, chunksize=None):
        print(f"Loading CSV from: {self.file_path}")
        return pd.read_csv(self.file_path, chunksize=chunksize)

class ShapefileLoader(DataLoader):
    """Loads spatial data from ESRI Shapefiles and converts to GeoJSON-like format"""
    def load(self):
        print(f"Loading Shapefile from: {self.file_path}")
        try:
            import pyproj
            # EPSG:2263 is NAD83 / New York Long Island (standard for NYC data)
            # EPSG:4326 is WGS84 (Lat/Long) for Leaflet
            transformer = pyproj.Transformer.from_crs("EPSG:2263", "EPSG:4326", always_xy=True)
            
            sf = shapefile.Reader(self.file_path)
            fields = [f[0] for f in sf.fields][1:] # Skip DeletionFlag
            records = []
            for sr in sf.shapeRecords():
                atr = dict(zip(fields, sr.record))
                geom = sr.shape.__geo_interface__
                
                # Reproject coordinates
                if geom['type'] == 'Polygon':
                    new_coords = []
                    for ring in geom['coordinates']:
                        new_coords.append([list(transformer.transform(x, y)) for x, y in ring])
                    geom['coordinates'] = new_coords
                elif geom['type'] == 'MultiPolygon':
                    new_poly_coords = []
                    for poly in geom['coordinates']:
                        new_rings = []
                        for ring in poly:
                            new_rings.append([list(transformer.transform(x, y)) for x, y in ring])
                        new_poly_coords.append(new_rings)
                    geom['coordinates'] = new_poly_coords
                
                records.append({
                    "attributes": atr,
                    "geometry": geom
                })
            return records
        except Exception as e:
            print(f"Error loading shapefile: {e}")
            return []

if __name__ == "__main__":
    # Test snippet
    # loader.py is in backend/etl/ingestion/loaders.py
    # we need to go up 3 levels to reach the root
    script_dir = os.path.dirname(os.path.abspath(__file__))
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(script_dir)))
    
    # Test CSV
    lookup_path = os.path.join(base_dir, 'taxi_zone_lookup.csv')
    print(f"Checking for lookup at: {lookup_path}")
    if os.path.exists(lookup_path):
        loader = CSVLoader(lookup_path)
        df_iter = loader.load(chunksize=5)
        print("CSV Chunk Preview:")
        print(next(df_iter))
    else:
        print("Lookup CSV not found.")

    # Test Shapefile
    shp_path = os.path.join(base_dir, 'taxi_zones', 'taxi_zones.shp')
    print(f"Checking for shapefile at: {shp_path}")
    if os.path.exists(shp_path):
        loader = ShapefileLoader(shp_path)
        zones = loader.load()
        print(f"Loaded {len(zones)} zones from shapefile.")
    else:
        print("Shapefile not found.")

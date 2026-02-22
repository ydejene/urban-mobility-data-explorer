-- database\schema.sql
-- NYC Taxi Urban Mobility Explorer: Full Database Schema based on Finalized ERD.
-- Defines tables for trips, zones, time dimensions, and users, along with performance indexes.

-- 1. Create Dimension: PAYMENT_TYPES
CREATE TABLE IF NOT EXISTS payment_types (
    payment_id INTEGER PRIMARY KEY,
    payment_name TEXT NOT NULL
);

-- 2. Create Dimension: TAXI_ZONES
CREATE TABLE IF NOT EXISTS taxi_zones (
    location_id INTEGER PRIMARY KEY,
    borough TEXT,
    zone TEXT,
    service_zone TEXT,
    geojson TEXT -- Stores the spatial polygon data for the map
);

-- 3. Create Dimension: TIME_DIM
CREATE TABLE IF NOT EXISTS time_dim (
    time_id INTEGER PRIMARY KEY AUTOINCREMENT,
    datetime TIMESTAMP NOT NULL,
    hour INTEGER,
    day_of_week INTEGER,
    day_of_month INTEGER,
    month INTEGER,
    year INTEGER,
    is_weekend BOOLEAN
);

-- 4. Create Fact Table: TRIPS
CREATE TABLE IF NOT EXISTS trips (
    trip_id INTEGER PRIMARY KEY AUTOINCREMENT,
    vendor_id INTEGER,
    passenger_count INTEGER,
    trip_distance REAL,
    rate_code_id INTEGER,
    payment_type_id INTEGER,
    fare_amount REAL,
    extra REAL,
    mta_tax REAL,
    tip_amount REAL,
    pickup_location_id INTEGER,
    dropoff_location_id INTEGER,
    tolls_amount REAL,
    improvement_surcharge REAL,
    total_amount REAL,
    congestion_surcharge REAL,
    pickup_time_id INTEGER,
    dropoff_time_id INTEGER,

);
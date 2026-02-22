-- database\schema.sql
-- NYC Taxi Urban Mobility Explorer: Full Database Schema based on Finalized ERD.
-- Defines tables for trips, zones, time dimensions, and users, along with performance indexes.

-- 1. Create Dimension: PAYMENT_TYPES
CREATE TABLE IF NOT EXISTS payment_types (
    payment_id INTEGER PRIMARY KEY,
    payment_name TEXT NOT NULL
);
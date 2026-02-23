# NYC Taxi Urban Mobility Data Explorer

## Project Overview

A comprehensive urban mobility data exploration platform that analyzes and visualizes NYC Yellow Taxi trip data. The system provides an interactive dashboard for urban planners and analysts to explore trip patterns, identify coverage gaps, detect anomalies, and analyze rush hour trends—powered by a Flask backend, SQLite database, and custom ETL pipeline with feature engineering.

## Team Members

- **Brian Nakuwa** — Architecture and Back End
- **Habibllah Ayodele** — Architecture and Front End
- **Derrick Gatete** — Back End
- **Yonas Dejene** — Back End

## Quick Links

| Resource | Link |
|----------|------|
| Video Walkthrough | [Watch on YouTube](https://www.youtube.com/watch?v=_YJP0Ue1T1M) |
| Team Task Sheet | [Google Sheets](https://docs.google.com/spreadsheets/d/1DmfLK_9kFoBP550wWKPLM11yVt0t52JibP-lopPt2uA/edit?usp=sharing) |
| Architecture Diagram | [docs/architecture-diagram.png](./docs/architecture-diagram.png) |
| ERD Diagram | [docs/erd-diagram.png](./docs/erd-diagram.png) |
| Scrum Board | [Team 2 Jira Board](https://alustudent-team-k1plq8kl.atlassian.net/jira/software/projects/NTUMDE/boards/67) |

## Table of Contents

- [Project Overview](#project-overview)
- [Project Structure](#project-structure)
- [System Architecture](#system-architecture)
  - [Installation & Setup](#installation--setup)
  - [First Time Use](#first-time-use)
- [Data Flow (User Journey)](#data-flow-user-journey)
- [Architecture Layers](#architecture-layers)
  - [Layer 1: User Interface](#layer-1-user-interface-frontend)
  - [Layer 2: Security Layer](#layer-2-security-layer)
  - [Layer 3: Application Layer (Backend)](#layer-3-application-layer-backend)
  - [Layer 4: Data Access Layer](#layer-4-data-access-layer)
  - [Layer 5: Storage Layer (Database)](#layer-5-storage-layer-database)
  - [Layer 6: ETL Pipeline](#layer-6-etl-pipeline-background-processing)
- [Security Architecture](#security-architecture)
- [Key Insights to Derive](#key-insights-to-derive)
- [Design Decisions & Trade-offs](#design-decisions--trade-offs)
- [Future Enhancements](#future-enhancements)
- [Unexpected Observation](#unexpected-observation)

---

## Project Structure

```
Urban_Mobility_Data_Explorer/
├── README.md
├── requirements.txt
├── data/
│   ├── yellow_tripdata_2019-01.csv    # Raw trip data (not in repo)
│   ├── taxi_zones/
│   │   └── taxi_zones.shp             # Zone boundaries (not in repo)
│   └── logs/
│       └── etl.log
├── backend/
│   ├── run.py                         # Flask API entry point
│   ├── dal/
│   │   ├── init_db.py                 # Database initialization
│   │   └── trip_dal.py                # Data Access Layer
│   ├── etl/
│   │   ├── pipeline.py                # ETL orchestrator
│   │   ├── ingestion/
│   │   │   └── loaders.py             # CSV + Shapefile loaders
│   │   ├── processing/
│   │   │   └── cleaner.py             # Data cleaning
│   │   └── features/
│   │       └── feature_engineer.py    # Derived metrics
│   ├── logic/
│   │   ├── aggregators.py             # SQL business logic
│   │   └── algorithms.py              # Custom QuickSort, anomaly detection
│   └── security/
│       ├── auth_logic.py              # Password hashing, tokens
│       └── validator.py               # Request validation
├── database/
│   ├── schema.sql
│   └── taxi_data.db                   # SQLite database
├── frontend/
│   ├── index.html                     # Login page
│   ├── signup.html                    # Signup page
│   ├── dashboard.html                 # Main dashboard
│   ├── css/
│   │   └── styles.css                 # Main stylesheet (was "style.css" in older docs)
│   └── js/                            # Frontend logic (multiple modules)
│       ├── api.js
│       ├── map.js
│       ├── charts.js
│       ├── panel.js
│       ├── search.js
│       ├── chips.js
│       ├── insights.js
│       └── sample-zones.js
└── docs/
    └── architecture-diagram.png
```

---

## System Architecture

### Architecture Philosophy

Our architecture follows a **user-centric, insight-driven design** that transforms raw urban mobility data into actionable intelligence. The system is built around three core principles:

1. **User Experience First**: Dashboard-centered design enabling urban planners to explore patterns intuitively
2. **Data Integrity**: Rigorous ETL pipeline ensuring clean, validated, and enriched data
3. **Security & Performance**: Multi-layer security with optimized queries for real-time analytics

[Link to Architecture Diagram](./docs/architecture-diagram.png)

---

### Installation & Setup

**Prerequisites**: Python 3.8 or higher

**Note**: Run all commands from the project root directory.

1. **Clone the repository**
   ```bash
   git clone https://github.com/ydejene/urban-mobility-data-explorer
   cd urban-mobility-data-explorer
   ```

2. **Create a virtual environment (recommended)**
   ```bash
   python -m venv venv
   # Windows
   venv\Scripts\activate
   # macOS/Linux
   source venv/bin/activate
   ```

3. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Initialize the database**
  ```bash
  python backend/dal/init_db.py
  ```
  This is the recommended command (it resolves paths relative to the script and works when run from the project root). It creates `database/taxi_data.db` and all tables from `database/schema.sql`.

  *Alternative:* `backend/apply_schema.py` also applies the schema, but it expects to be run from the `backend` directory. If you prefer that script, run:
  ```bash
  cd backend
  python apply_schema.py
  ```
  Running `python backend/apply_schema.py` from the project root may fail because that script uses relative paths.

5. **(Optional) Load data — ETL Pipeline**

   Raw taxi data is not included due to file size. To populate the dashboard with trip data:

   - **Trip data**: [NYC TLC Trip Record Data](https://www.nyc.gov/site/tlc/about/tlc-trip-record-data.page) — download `yellow_tripdata_2019-01.csv`
   - **Taxi zones shapefile**: [taxi_zones.zip](https://d37ci6vzurychx.cloudfront.net/misc/taxi_zones.zip) — extract to `data/taxi_zones/`

   Place files as:
   - `data/yellow_tripdata_2019-01.csv`
   - `data/taxi_zones/taxi_zones.shp` (plus `.shx`, `.dbf` in same folder)

   Then run:
   ```bash
   python backend/etl/pipeline.py
   ```
   Processes up to 1M rows. **You can skip this step** — the app runs with an empty database (login/signup work; dashboard will show no trip data).

6. **Environment setup**  
   No `.env` file required. Optional: set `SECRET_KEY` for production. Defaults work for local development.

7. **Launch the application**
   ```bash
   python backend/run.py
   ```
   Output: `Running on http://127.0.0.1:5000`

8. **Open the frontend**  
   The Flask backend serves both the API and the frontend. In your browser, visit:
   ```
   http://127.0.0.1:5000
   ```
   You can also use [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) in VS Code — ensure the backend is running on port 5000 so API calls succeed.

### First Time Use

1. **Sign up**: Go to `http://127.0.0.1:5000` and create an account (e.g. `test@example.com` / `test123`).
2. **Log in** with your credentials.
3. **Use the dashboard** to explore analytics (requires ETL data for trip visualizations).

---

## Data Flow (User Journey)

```
 URBAN PLANNER / ANALYST
   ↓ Opens browser
 WEB DASHBOARD (Interactive Maps + Charts)
   ↓ Filters by date/location/borough
 SECURITY LAYER (Input validation, CORS)
   ↓ API Request
 FLASK BACKEND API
   ↓ Executes custom algorithms & SQL
 SQLITE DATABASE
   ↑ Populated by
 ETL PIPELINE (Cleans + Feature Engineering)
   ↑ Processes
 RAW DATA (CSV + Shapefile)
```

---

## Architecture Layers

### Layer 1: User Interface (Frontend)

**Purpose**: Enable urban planners to explore taxi trip patterns and derive insights

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Interactive Dashboard** | HTML5, CSS3, JavaScript | Main exploration interface with borough/zone filters and visualizations |
| **Map Visualization** | Leaflet.js | Renders taxi zones with GeoJSON polygons from Shapefile data |
| **Charts Engine** | Chart.js | Time-series trends, hourly activity, rush hour analysis |
| **Filter Controls** | Vanilla JS | Date range, borough, zone selectors |
| **Auth Pages** | HTML/JS | Login (index.html), Signup (signup.html), Dashboard (dashboard.html) |

**User Interactions**:
- Select date range, borough, zone → Filter trips and analytics
- Click taxi zone on map → Show zone-specific stats
- Hover over chart → See detailed tooltips
- Login/Signup → Token-based session management

---

### Layer 2: Security Layer

**Purpose**: Protect data and prevent malicious queries

| Security Measure | Implementation | Protects Against |
|-----------------|----------------|------------------|
| **Input Validation** | `backend/security/validator.py` | Malformed requests, invalid parameters |
| **CORS Policy** | Flask-CORS | Unauthorized cross-origin API access |
| **SQL Parameterization** | Prepared statements (?) | SQL injection |
| **Auth Logic** | `backend/security/auth_logic.py` | Password hashing (bcrypt), token generation |
| **Request Logging** | App logger | Audit trail of API requests |

---

### Layer 3: Application Layer (Backend)

**Purpose**: Process requests, execute business logic, serve data

#### REST API Endpoints

```
GET  /                          → Serves index.html (Login)
GET  /dashboard                 → Serves dashboard.html
GET  /api/auth/signup (POST)    → Create user account
POST /api/auth/login            → Authenticate, return token
GET  /api/health                → Health check

GET  /api/trips/summary?start_date=...&end_date=...&borough=...&zone_id=...
     → Returns mobility metrics (trip count, avg fare, revenue, speed, anomalies)

GET  /api/trips/hourly?start_date=...&end_date=...&borough=...&zone_id=...
     → Returns trip volume and speed by hour (rush hour analysis)

GET  /api/trips/gaps?start_date=...&end_date=...&borough=...&zone_id=...
     → Returns top underserved zones (dropoff/pickup ratio)

GET  /api/trips/revenue         → Congestion index and revenue metrics

GET  /api/boroughs/<borough>/stats
     → Returns aggregated stats for a specific borough

GET  /api/zones                 → Returns all taxi zones with GeoJSON for map
GET  /api/zones/<zone_id>/stats → Returns detailed stats for a zone

GET  /api/report?start_date=...&end_date=...&borough=...&zone_id=...
     → Returns detailed diagnostic report (anomalies, choke points)
```

#### Custom Algorithm Implementation (No Built-in Libraries for Ranking)

**Requirement**: Manually implement at least one algorithm without using built-in sort functions

**Our Implementation**: **Custom QuickSort for Zone Ranking**

**Problem**: Rank taxi zones by coverage gap ratio (dropoff/pickup) to identify underserved areas

**Approach**: Manual QuickSort implemented from scratch in `backend/logic/algorithms.py`

```python
# Custom QuickSort (backend/logic/algorithms.py)
def quick_sort_zones(arr, key='score'):
    """
    Manually implemented QuickSort - no built-in sorted() or sort_values().
    Time Complexity: O(n log n) average
    Space Complexity: O(log n)
    """
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x[key] > pivot[key]]   # Descending
    middle = [x for x in arr if x[key] == pivot[key]]
    right = [x for x in arr if x[key] < pivot[key]]
    return quick_sort_zones(left, key) + middle + quick_sort_zones(right, key)
```

**Other Custom Logic**:
- **Anomaly Detection**: System noise (speed > 80 mph), economic noise (fare > $100 for < 1 mile)
- **Coverage Gap Identification**: Supply vs. demand imbalance (high dropoff/pickup ratio)
- **Choke Point Detection**: Zones with avg speed < 4.5 mph (slower than walking)

---

### Layer 4: Data Access Layer

| Component | Location | Purpose |
|-----------|----------|---------|
| **TripDAL** | `backend/dal/trip_dal.py` | Bulk insert trips and zones, CRUD abstraction |
| **Init DB** | `backend/dal/init_db.py` | Database initialization from schema.sql |
| **Connection** | SQLite with WAL mode | Optimized for read-heavy analytics |

---

### Layer 5: Storage Layer (Database)

**Technology**: SQLite3 — chosen for portability, zero-configuration setup, and adequate performance for diagnostic/demo workloads.

#### Database Schema (Normalized)

**payment_types** (Dimension)
```sql
CREATE TABLE payment_types (
    payment_id INTEGER PRIMARY KEY,
    payment_name TEXT NOT NULL
);
```

**taxi_zones** (Dimension)
```sql
CREATE TABLE taxi_zones (
    location_id INTEGER PRIMARY KEY,
    borough TEXT,
    zone TEXT,
    service_zone TEXT,
    geojson TEXT  -- GeoJSON polygon for map rendering
);
```

**time_dim** (Dimension)
```sql
CREATE TABLE time_dim (
    time_id INTEGER PRIMARY KEY AUTOINCREMENT,
    datetime TIMESTAMP NOT NULL,
    hour INTEGER, day_of_week INTEGER, day_of_month INTEGER,
    month INTEGER, year INTEGER, is_weekend BOOLEAN
);
```

**trips** (Fact Table)
```sql
CREATE TABLE trips (
    trip_id INTEGER PRIMARY KEY AUTOINCREMENT,
    vendor_id, passenger_count, trip_distance, rate_code_id, payment_type_id,
    fare_amount, extra, mta_tax, tip_amount, tolls_amount, total_amount, congestion_surcharge,
    pickup_location_id, dropoff_location_id, pickup_time_id, dropoff_time_id,
    -- Derived features
    speed_mph REAL,
    fare_per_mile REAL,
    trip_duration_seconds INTEGER,
    pickup_date TEXT,    -- YYYY-MM-DD for fast filtering
    pickup_hour INTEGER, -- 0-23 for rush hour analysis
    store_and_fwd_flag BOOLEAN,
    FOREIGN KEY (pickup_location_id) REFERENCES taxi_zones(location_id),
    FOREIGN KEY (dropoff_location_id) REFERENCES taxi_zones(location_id)
);
```

**users** (Authentication)
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes**:
- `idx_trips_pickup_location`, `idx_trips_dropoff_location`, `idx_trips_pickup_date`, `idx_trips_pickup_hour`, `idx_trips_speed`, `idx_trips_total_amount`, etc.

---

### Layer 6: ETL Pipeline (Background Processing)

#### Phase 1: Data Ingestion

| Loader | File | Purpose |
|--------|------|---------|
| **CSVLoader** | `backend/etl/ingestion/loaders.py` | Loads `yellow_tripdata_2019-01.csv` in chunks (100k rows) |
| **ShapefileLoader** | `backend/etl/ingestion/loaders.py` | Loads `taxi_zones.shp`, reprojects EPSG:2263 → EPSG:4326, outputs GeoJSON |

#### Phase 2: Data Cleaning & Validation

`backend/etl/processing/cleaner.py`:

- Remove trips with negative `fare_amount` or `total_amount`
- Remove trips with zero or negative `trip_distance`
- Remove trips with zero `passenger_count`
- Drop rows with missing `PULocationID`, `DOLocationID`, `tpep_pickup_datetime`
- Validate zone geometry (non-empty polygons)

#### Phase 3: Feature Engineering

`backend/etl/features/feature_engineer.py`:

| Feature | Formula | Business Value |
|---------|---------|----------------|
| **speed_mph** | `trip_distance / (duration_hours)` | Identify congestion, flag anomalies |
| **fare_per_mile** | `fare_amount / trip_distance` | Route profitability |
| **tip_percentage** | `(tip_amount / fare_amount) * 100` | Tipping behavior |
| **pickup_hour** | Extract hour from datetime | Rush hour analysis |
| **pickup_date** | YYYY-MM-DD | Fast date filtering |
| **trip_duration_seconds** | Dropoff - Pickup | Duration analytics |
| **Outlier capping** | speed > 100 mph → NaN | Data quality |

#### Phase 4: Orchestration

`backend/etl/pipeline.py`:
1. Process zones (Shapefile → clean → insert)
2. Process trips in 100k-row chunks: load → clean → feature engineer → insert
3. Limit to 1M rows for demo

---

## Security Architecture

### Defense-in-Depth Strategy

```
[User Input]
   → Frontend Validation (JS)
       → CORS Policy
           → Backend Input Sanitization (validator.py)
               → SQL Parameterization
                   → Database (SQLite)
                       → Request Logging
```

### Security Controls by Layer

| Layer | Control | Implementation |
|-------|---------|----------------|
| Frontend | XSS Prevention | Escape user inputs before rendering |
| API | SQL Injection Prevention | Parameterized queries only |
| API | Auth | bcrypt password hashing, token-based sessions |
| Database | Access | Single file, app-managed connections |

---

## Key Insights to Derive

### Insight 1: Rush Hour Congestion Patterns

**Hypothesis**: Trip speeds drop significantly during rush hours in specific boroughs

**Derivation**: `/api/trips/hourly` — hourly stats with `avg_speed` and `trip_count`

**Visualization**: Line chart of average speed by hour  
**Interpretation**: Optimal travel times, traffic policy

---

### Insight 2: Coverage Gap Analysis (Supply-Demand Imbalance)

**Hypothesis**: Zones where drop-offs exceed pick-ups indicate underserved areas

**Derivation**: `/api/trips/gaps` — zones ranked by dropoff/pickup ratio using custom QuickSort

**Visualization**: Map and table of top underserved zones  
**Interpretation**: Where demand outstrips supply, expansion opportunities

---

### Insight 3: Anomaly Detection (System & Economic Noise)

**Hypothesis**: Impossible speeds and suspicious fare/distance ratios indicate data errors or fraud

**Derivation**: Custom logic in `algorithms.py` and `aggregators.py`:
- **System noise**: `speed_mph > 80`
- **Economic noise**: `trip_distance < 1` and `fare_amount > 100`
- **Choke points**: `avg_speed < 4.5 mph` (slower than walking)

**Visualization**: Diagnostic report, anomaly counts in summary  
**Interpretation**: Data quality, possible meter issues

---

## Design Decisions & Trade-offs

### Decision 1: SQLite vs PostgreSQL

**Choice**: SQLite  
**Reasoning**:
- Zero-configuration, portable
- Adequate for demo and single-user use
- Trade-off: Less suitable for high-concurrency production

### Decision 2: Vanilla JS vs React/Vue

**Choice**: Vanilla JavaScript  
**Reasoning**:
- Lightweight, no build step
- Fast iteration
- Trade-off: Less structure for very large UIs

### Decision 3: Batch ETL vs Real-time Streaming

**Choice**: Batch processing  
**Reasoning**:
- Historical dataset, not streaming
- Full data quality checks possible
- Trade-off: Not real-time

---

## Future Enhancements

1. **Machine Learning**: Predict trip demand by location/time
2. **Real-time Streaming**: Integrate live NYC Open Data feeds
3. **Mobile App**: iOS/Android for field use
4. **Spatial Clustering**: ML to auto-group high-demand zones
5. **Deployment**: Docker, cloud hosting with auto-scaling

---

## Unexpected Observation

**Finding**: ~5% of trips had average speed > 100 mph, likely due to GPS/timestamp noise.

**Impact**:
- Added speed capping in `feature_engineer.py` (values > 100 set to NaN)
- Custom anomaly detection for system noise (speed > 80 mph) and economic noise
- Improved data integrity for dashboards


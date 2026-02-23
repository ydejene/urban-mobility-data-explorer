#!/usr/bin/env python3
"""Chunked trip analysis and zone enrichment.

Saves CSV outputs to ./output/ and prints a short insights summary.

Run from repo root:
  python tools/analyze_trips.py --trips data/yellow_tripdata_2019-01.csv --zones data/taxi_zone_lookup.csv

"""
import os
import argparse
from collections import defaultdict, Counter
import pandas as pd
import numpy as np

OUT = "output"
os.makedirs(OUT, exist_ok=True)

CLEAN_RULES = {
    "min_speed_flag": 100.0,   # treat >100 mph as invalid for speed field
    "anomaly_speed": 80.0,     # system noise threshold
    "economic_fare": 100.0,    # economic anomaly threshold for short trips
    "economic_dist_mi": 1.0,
}

def std_cols(df):
    return {c.lower(): c for c in df.columns}

def find(cols, *names):
    for n in names:
        if n in cols:
            return cols[n]
    return None

def clean_and_aggregate(trips_csv, zones_csv, chunksize=200_000, sample_per_chunk=200):
    pu_counts = defaultdict(int)
    do_counts = defaultdict(int)
    hour_stats = defaultdict(lambda: {"count":0,"sum_speed":0.0,"sum_fare":0.0})
    drop_reasons = Counter()
    anomaly_counters = Counter()
    samples = []

    trips_iter = pd.read_csv(trips_csv, chunksize=chunksize, low_memory=False)
    for chunk in trips_iter:
        cols = std_cols(chunk)
        # map expected columns (flexible)
        pickup_dt_col = find(cols, "tpep_pickup_datetime","pickup_datetime","pickup_datetime")
        dropoff_dt_col = find(cols, "tpep_dropoff_datetime","dropoff_datetime")
        pul_col = find(cols, "pulocationid","pickup_location_id","pu_locationid","pu_location_id")
        dol_col = find(cols, "dolocationid","dropoff_location_id","do_locationid","do_location_id")
        dist_col = find(cols, "trip_distance","tripdistance","distance")
        fare_col = find(cols, "fare_amount","fare")
        total_col = find(cols, "total_amount","total")
        pax_col = find(cols, "passenger_count","passengers")

        # basic parsing
        if pickup_dt_col: chunk[pickup_dt_col] = pd.to_datetime(chunk[pickup_dt_col], errors="coerce")
        if dropoff_dt_col: chunk[dropoff_dt_col] = pd.to_datetime(chunk[dropoff_dt_col], errors="coerce")
        for n in (dist_col, fare_col, total_col, pax_col):
            if n: chunk[n] = pd.to_numeric(chunk[n], errors="coerce")

        # required fields check
        required = [pickup_dt_col, dropoff_dt_col, pul_col, dol_col, dist_col, fare_col, total_col, pax_col]
        missing_required = [r for r in required if r is None]
        if missing_required:
            raise SystemExit(f"Missing required columns in CSV: {missing_required}")

        # drop NA critical
        before = len(chunk)
        chunk = chunk.dropna(subset=[pickup_dt_col, dropoff_dt_col, pul_col, dol_col])
        drop_reasons["missing_critical"] += before - len(chunk)

        # enforce numeric business rules
        mask_valid = (
            (chunk[dist_col] > 0) &
            (chunk[fare_col] >= 0) &
            (chunk[total_col] >= 0) &
            (chunk[pax_col] > 0)
        )
        dropped = (~mask_valid).sum()
        drop_reasons["business_rule_invalid"] += int(dropped)
        chunk = chunk[mask_valid]

        if chunk.empty:
            continue

        # duration, speed
        dur_hours = (chunk[dropoff_dt_col] - chunk[pickup_dt_col]).dt.total_seconds() / 3600.0
        dur_hours = dur_hours.clip(lower=1e-6)
        speed = chunk[dist_col] / dur_hours
        # mark unrealistic speeds
        speed_mask_invalid = speed > CLEAN_RULES["min_speed_flag"]
        if speed_mask_invalid.any():
            anomaly_counters["speed_over_100_flagged"] += int(speed_mask_invalid.sum())
            speed = speed.mask(speed_mask_invalid, other=np.nan)
        chunk["_speed_mph"] = speed

        # anomalies
        sys_noise = (chunk["_speed_mph"] > CLEAN_RULES["anomaly_speed"])
        econ_noise = (chunk[dist_col] < CLEAN_RULES["economic_dist_mi"]) & (chunk[fare_col] > CLEAN_RULES["economic_fare"])
        anomaly_counters["system_noise_speed_gt_80"] += int(sys_noise.sum())
        anomaly_counters["economic_noise_fare_gt_100_for_<1mi"] += int(econ_noise.sum())

        # aggregate pickup/drop counts
        for loc, cnt in chunk[pul_col].value_counts().items():
            pu_counts[int(loc)] += int(cnt)
        for loc, cnt in chunk[dol_col].value_counts().items():
            do_counts[int(loc)] += int(cnt)

        # hourly aggregates (use pickup hour)
        ph = chunk[pickup_dt_col].dt.hour.fillna(-1).astype(int)
        for hour, grp in chunk.groupby(ph):
            if hour < 0: continue
            c = len(grp)
            hour_stats[hour]["count"] += c
            hour_stats[hour]["sum_speed"] += grp["_speed_mph"].dropna().sum()
            hour_stats[hour]["sum_fare"] += grp[fare_col].sum()

        # sample small rows for merged sample
        samples.append(chunk.sample(n=min(sample_per_chunk, len(chunk)), random_state=1))

    # finalize hourly frame
    hourly = []
    for h in range(24):
        s = hour_stats.get(h, {"count":0,"sum_speed":0.0,"sum_fare":0.0})
        cnt = s["count"]
        avg_speed = (s["sum_speed"]/cnt) if cnt>0 else np.nan
        avg_fare = (s["sum_fare"]/cnt) if cnt>0 else np.nan
        hourly.append({"hour":h,"trip_count":cnt,"avg_speed_mph":round(float(avg_speed),2) if not np.isnan(avg_speed) else None,"avg_fare":round(float(avg_fare),2) if not np.isnan(avg_fare) else None})
    hourly_df = pd.DataFrame(hourly).sort_values("hour")

    # zones with counts
    zones = pd.read_csv(zones_csv)
    zones = zones.rename(columns={c:c for c in zones.columns})
    pu_df = pd.DataFrame(list(pu_counts.items()), columns=["LocationID","pickup_count"]) if pu_counts else pd.DataFrame(columns=["LocationID","pickup_count"])
    do_df = pd.DataFrame(list(do_counts.items()), columns=["LocationID","dropoff_count"]) if do_counts else pd.DataFrame(columns=["LocationID","dropoff_count"])
    zones_counts = zones.merge(pu_df, left_on="LocationID", right_on="LocationID", how="left")
    zones_counts = zones_counts.merge(do_df, left_on="LocationID", right_on="LocationID", how="left")
    zones_counts["pickup_count"] = zones_counts["pickup_count"].fillna(0).astype(int)
    zones_counts["dropoff_count"] = zones_counts["dropoff_count"].fillna(0).astype(int)
    zones_counts["gap_ratio"] = zones_counts.apply(lambda r: (r["dropoff_count"]/r["pickup_count"]) if r["pickup_count"]>0 else np.nan, axis=1)
    top_gaps = zones_counts.dropna(subset=["gap_ratio"]).sort_values("gap_ratio", ascending=False).head(50)

    # choke points: low avg speed per zone -> compute using sampled rows merged with zones if samples exist
    merged_sample = pd.concat(samples, ignore_index=True) if samples else pd.DataFrame()
    choke_df = pd.DataFrame()
    if not merged_sample.empty:
        # try to merge using lowercase/uppercase tolerant keys
        pul_key = [c for c in merged_sample.columns if c.lower().startswith('pu') and 'location' in c.lower()]
        pul_key = pul_key[0] if pul_key else 'pulocationid'
        merged_sample = merged_sample.merge(zones.add_prefix("PU_"), left_on=pul_key, right_on="PU_LocationID", how="left")
        g = merged_sample.groupby(pul_key)["_speed_mph"].agg(["count","mean"]).reset_index().rename(columns={pul_key:"LocationID","count":"sample_count","mean":"avg_speed_mph"})
        choke_df = g[g["avg_speed_mph"]<4.5].sort_values("avg_speed_mph").head(50)

    # save outputs
    hourly_df.to_csv(os.path.join(OUT,"hourly_summary.csv"), index=False)
    zones_counts.to_csv(os.path.join(OUT,"zones_with_counts.csv"), index=False)
    top_gaps.to_csv(os.path.join(OUT,"top_gap_zones.csv"), index=False)
    if not merged_sample.empty:
        merged_sample.head(1000).to_csv(os.path.join(OUT,"merged_sample.csv"), index=False)
    if not choke_df.empty:
        choke_df.to_csv(os.path.join(OUT,"choke_points_sample.csv"), index=False)

    summary = {
        "hourly_csv": os.path.join(OUT,"hourly_summary.csv"),
        "zones_csv": os.path.join(OUT,"zones_with_counts.csv"),
        "top_gaps_csv": os.path.join(OUT,"top_gap_zones.csv"),
        "merged_sample_csv": os.path.join(OUT,"merged_sample.csv") if not merged_sample.empty else None,
        "choke_csv": os.path.join(OUT,"choke_points_sample.csv") if not choke_df.empty else None,
        "drop_reasons": dict(drop_reasons),
        "anomalies": dict(anomaly_counters),
        "total_zones": len(zones_counts),
    }
    return summary, hourly_df, top_gaps, choke_df

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--trips", required=True, help="Path to yellow trip CSV")
    p.add_argument("--zones", required=True, help="Path to taxi_zone_lookup.csv")
    p.add_argument("--chunksize", type=int, default=200000)
    args = p.parse_args()

    summary, hourly_df, top_gaps, choke_df = clean_and_aggregate(args.trips, args.zones, chunksize=args.chunksize)
    # concise console output
    print("Outputs written to ./output/")
    print("Hourly summary:", summary["hourly_csv"])
    print("Zones with counts:", summary["zones_csv"])
    print("Top gap zones:", summary["top_gaps_csv"])
    if summary["merged_sample_csv"]:
        print("Merged sample (small):", summary["merged_sample_csv"])
    if summary["choke_csv"]:
        print("Choke point sample:", summary["choke_csv"])
    print("\nDrop reasons (counts):", summary["drop_reasons"])
    print("Anomalies detected:", summary["anomalies"])
    print("\nTop 5 gap zones (LocationID, zone, borough, gap_ratio):")
    if not top_gaps.empty and {'LocationID','zone','borough','gap_ratio'}.issubset(top_gaps.columns):
        print(top_gaps[["LocationID","zone","borough","gap_ratio"]].head(5).to_string(index=False))
    else:
        print(top_gaps[[c for c in top_gaps.columns if c in ("LocationID","gap_ratio")]].head(5).to_string(index=False))
    print("\nTop 3 congested hours (lowest avg_speed with >=100 trips):")
    cand = hourly_df[hourly_df["trip_count"]>=100].sort_values("avg_speed_mph").head(3)
    print(cand.to_string(index=False))

if __name__=="__main__":
    main()

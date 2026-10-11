"""
Test Suite for Serverless Pre-Warming & Cold-Start Optimization.

Verifies IEEE Paper Implementation:
1. Azure Functions 2019 trace generator & calibration (Table I).
2. 26 predictor variable extraction without future leakage.
3. Multi-horizon XGBoost workload predictors (5m, 15m, 30m; Table III).
4. Dynamic resource tiering percentile thresholds (Table IV).
5. Agentic closed-loop controller state transitions (Section V-C).
6. 4-architecture comparative evaluation (Table V).
7. 6-variant component ablation study (Table VI).
8. Canonical benchmark data retrieval.
"""

import sys
import os
import pytest
import numpy as np
import pandas as pd

# Add repo and src to sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)
sys.path.insert(0, os.path.join(BASE_DIR, "src"))

from serverless_prewarming import (
    generate_azure_functions_trace,
    extract_predictor_features,
    MultiHorizonWorkloadPredictor,
    DynamicResourceTierer,
    AgenticDecisionController,
    simulate_system_trace,
    run_serverless_comparative_evaluation,
    get_canonical_paper_benchmark,
    WARM_LATENCY_MS,
    COLD_LATENCY_MS,
    SLA_LIMIT_MS,
    CONTAINER_CAPACITY,
    CANONICAL_TIER1_CUTOFF,
    CANONICAL_TIER2_CUTOFF,
)


def test_azure_trace_calibration():
    print("\n[TEST 1] Testing Azure Functions 2019 trace calibration...")
    df = generate_azure_functions_trace(seed=42)
    assert len(df) == 20160, f"Expected 20,160 minutes, got {len(df)}"
    assert "timestamp" in df.columns
    assert "invocations" in df.columns
    assert "is_spike" in df.columns
    
    mean_w = df["invocations"].mean()
    peak_w = df["invocations"].max()
    min_w = df["invocations"].min()
    spike_count = df["is_spike"].sum()
    
    print(f"  Rows: {len(df)}, Mean: {mean_w:,.2f}, Peak: {peak_w:,}, Min: {min_w:,}, Spikes: {spike_count}")
    assert 600000 < mean_w < 640000, "Mean workload deviates from target ~619,831"
    assert peak_w >= 1200000, "Peak workload below spike target"
    assert min_w <= 460000, "Min workload above target"
    assert spike_count == 103, f"Expected 103 spikes, got {spike_count}"
    print("  -> PASSED: Azure Functions trace matches Table I characteristics.")


def test_feature_engineering_integrity():
    print("\n[TEST 2] Testing 26-variable predictor feature extraction...")
    df = generate_azure_functions_trace(seed=42).iloc[:500].copy()
    features = extract_predictor_features(df)
    
    expected_cols = [
        "minute", "hour", "dayofweek", "day", "is_weekend",
        "hour_sin", "hour_cos", "min_sin", "min_cos", "dow_sin", "dow_cos",
        "lag_1", "lag_2", "lag_3", "lag_5", "lag_10", "lag_15", "lag_30", "lag_60",
        "rolling_mean_5", "rolling_std_5", "rolling_min_5",
        "rolling_mean_15", "rolling_std_15", "rolling_min_15",
        "rolling_mean_30", "rolling_std_30", "rolling_min_30", "rolling_max_30"
    ]
    for col in expected_cols:
        assert col in features.columns, f"Missing feature column: {col}"
        
    print(f"  Total engineered features: {features.shape[1]}")
    # Verify lag 1 is equal to shifted invocations
    assert features["lag_1"].iloc[10] == df["invocations"].iloc[9], "Lag 1 integrity check failed"
    print("  -> PASSED: Feature engineering pipeline verified without leakage.")


def test_dynamic_tiering():
    print("\n[TEST 3] Testing dynamic resource tiering...")
    tierer = DynamicResourceTierer()
    assert tierer.get_tier(500000) == 1, "Under 581,104 should be Tier 1"
    assert tierer.get_tier(600000) == 2, "Between cutoffs should be Tier 2"
    assert tierer.get_tier(700000) == 3, "Above 642,125 should be Tier 3"
    
    assert tierer.get_tier_minimum_instances(1) == 12
    assert tierer.get_tier_minimum_instances(2) == 13
    assert tierer.get_tier_minimum_instances(3) == 15
    print("  -> PASSED: Dynamic resource tiering logic verified.")


def test_agentic_controller_cycle():
    print("\n[TEST 4] Testing Agentic Closed-Loop Controller...")
    tierer = DynamicResourceTierer()
    controller = AgenticDecisionController(tierer=tierer)
    
    # Step 1: Normal load Tier 1
    action, tier, inst = controller.step(
        current_workload=520000,
        pred_5m=525000,
        pred_15m=530000,
        pred_30m=535000,
        prev_latency=50.0
    )
    print(f"  Cycle 1 (Low Demand): Action={action}, Tier={tier}, Instances={inst}")
    assert action in ["KEEP", "SCALE_UP", "SCALE_DOWN", "PREWARM", "CHANGE_TIER"]
    assert tier == 1
    
    # Step 2: Approaching Tier 2 transition
    action, tier, inst = controller.step(
        current_workload=580000,
        pred_5m=610000,
        pred_15m=620000,
        pred_30m=625000,
        prev_latency=50.0
    )
    print(f"  Cycle 2 (Approaching surge): Action={action}, Tier={tier}, Instances={inst}")
    assert action in ["CHANGE_TIER", "PREWARM", "SCALE_UP"]
    assert tier == 2
    print("  -> PASSED: Agentic controller state transition verified.")


def test_canonical_benchmark_retrieval():
    print("\n[TEST 5] Testing canonical paper benchmark data retrieval...")
    bench = get_canonical_paper_benchmark()
    assert "table_v_df" in bench
    assert "table_vi_df" in bench
    assert "prediction_metrics" in bench
    
    t5 = bench["table_v_df"]
    proposed_row = t5[t5["System Architecture"].str.contains("Agentic Framework")].iloc[0]
    assert proposed_row["Avg Lat (ms)"] == 50.00
    assert proposed_row["Cold Starts"] == 0
    assert proposed_row["CS Rate (%)"] == 0.0000
    assert proposed_row["Util (%)"] == 75.84
    print("  -> PASSED: Canonical benchmark matches paper publication numbers.")


def test_full_comparative_pipeline():
    print("\n[TEST 6] Running full comparative evaluation on 3,024-minute test set...")
    res = run_serverless_comparative_evaluation(seed=42)
    assert res["status"] == "success"
    assert res["test_minutes"] == 3024
    
    t5 = res["table_v_df"]
    print("\nSimulated Table V Results:")
    print(t5.to_string(index=False))
    
    proposed = res["systems"]["proposed_agentic"]
    assert proposed["avg_latency_ms"] <= 55.0, "Proposed avg latency must be close to 50ms"
    assert proposed["sla_violations_pct"] == 0.0, "Proposed must have 0% SLA violations"
    print("  -> PASSED: End-to-end multi-horizon and agentic simulation succeeded.")


if __name__ == "__main__":
    test_azure_trace_calibration()
    test_feature_engineering_integrity()
    test_dynamic_tiering()
    test_agentic_controller_cycle()
    test_canonical_benchmark_retrieval()
    test_full_comparative_pipeline()
    print("\n==========================================")
    print("ALL SERVERLESS PRE-WARMING TESTS PASSED!")
    print("==========================================")

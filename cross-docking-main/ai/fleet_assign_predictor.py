import sys
import json
import joblib
import numpy as np
import os
import warnings
warnings.filterwarnings("ignore", category=UserWarning)
import pandas as pd

def extract_features(fleet, package):
    remaining_capacity = fleet['capacity'] - fleet.get('currentCapacityUsed', 0)
    weight = package.get('weight', 0)
    priority_num = {'Low': 0, 'Medium': 1, 'High': 2, 'Urgent': 3}.get(package.get('priority', 'Low'), 0)
    return [remaining_capacity, weight, priority_num]

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(script_dir, 'fleet_assign_model.pkl')
    model = joblib.load(model_path)
    data = json.load(sys.stdin)
    fleets = data['fleets']
    package = data['package']
    # Filter fleets that can accommodate the package
    valid_fleets = []
    valid_features = []
    for f in fleets:
        remaining_capacity = f['capacity'] - f.get('currentCapacityUsed', 0)
        weight = package.get('weight', 0)
        if remaining_capacity >= weight:
            valid_fleets.append(f)
            valid_features.append(extract_features(f, package))
    if not valid_fleets:
        print(json.dumps({'error': 'No available fleet with enough capacity'}))
        return
    features = pd.DataFrame(valid_features, columns=['remaining_capacity', 'weight', 'priority_num'])
    # Predict scores (higher is better)
    if hasattr(model, 'predict_proba'):
        proba = model.predict_proba(features)
        # If only one class, proba.shape[1] == 1
        if proba.shape[1] == 1:
            scores = proba[:, 0]  # Only one class, use its probability
        else:
            scores = proba[:, 1]  # For binary classifier
    else:
        scores = model.predict(features)
    best_idx = int(np.argmax(scores))
    print(json.dumps({'best_fleet_index': best_idx, 'scores': scores.tolist()}))

if __name__ == '__main__':
    main() 
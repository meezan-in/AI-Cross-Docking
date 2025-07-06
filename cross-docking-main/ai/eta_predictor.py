import sys
import json

# Read input
input_data = json.load(sys.stdin)
features = input_data['features']

# Unpack features
# [distance_km, weight, priority_num, traffic_level]
distance_km = features[0]
weight = features[1]
priority_num = features[2]
traffic_level = features[3]

# Simple formula-based ETA
average_speed = 45  # km/h
weight_factor = 0.1 * (weight / 100)  # +6 min per 100kg
priority_factor = {0: 0.2, 1: 0.1, 2: 0, 3: -0.1}.get(priority_num, 0)  # Low: +12min, Medium: +6min, High: 0, Urgent: -6min
traffic_factor = {1: 0, 2: 0.2, 3: 0.5, 4: 1.0}.get(traffic_level, 0.2)  # 1: free, 2: normal, 3: heavy, 4: jammed

eta_hours = (distance_km / average_speed) + weight_factor + priority_factor + traffic_factor
eta_minutes = max(1, int(eta_hours * 60))

print(json.dumps({"eta_minutes": eta_minutes})) 
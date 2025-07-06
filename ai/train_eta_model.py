import pandas as pd
from sklearn.ensemble import RandomForestRegressor
import joblib

priority_map = {'Low': 0, 'Medium': 1, 'High': 2, 'Urgent': 3}
df = pd.read_csv('eta_data.csv')
df['priority_num'] = df['priority'].map(priority_map)
X = df[['distance_km', 'weight', 'priority_num', 'traffic_level']]
y = df['eta_hours']
reg = RandomForestRegressor(n_estimators=100, random_state=42)
reg.fit(X, y)
joblib.dump(reg, 'eta_model.pkl')
print('ETA model trained and saved as eta_model.pkl') 
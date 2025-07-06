import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import joblib

priority_map = {'Low': 0, 'Medium': 1, 'High': 2, 'Urgent': 3}
df = pd.read_csv('assignments.csv')
df['remaining_capacity'] = df['capacity'] - df['current_capacity_used']
df['priority_num'] = df['priority'].map(priority_map)
X = df[['remaining_capacity', 'weight', 'priority_num']]
y = df['assigned']
clf = RandomForestClassifier(n_estimators=100, random_state=42)
clf.fit(X, y)
joblib.dump(clf, 'fleet_assign_model.pkl')
print('Model trained and saved as fleet_assign_model.pkl') 
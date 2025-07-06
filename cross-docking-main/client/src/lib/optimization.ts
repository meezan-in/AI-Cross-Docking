import { cityCoordinates } from './cities';

export function calculateDistance(city1: string, city2: string): number {
  const coords1 = cityCoordinates[city1];
  const coords2 = cityCoordinates[city2];
  
  if (!coords1 || !coords2) return 0;

  const R = 6371; // Earth's radius in km
  const dLat = (coords2.lat - coords1.lat) * Math.PI / 180;
  const dLon = (coords2.lon - coords1.lon) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(coords1.lat * Math.PI / 180) * Math.cos(coords2.lat * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export interface OptimizationResult {
  fleetId: string;
  distance: number;
  score: number;
  reason: string;
}

export function optimizeFleetAssignment(
  packageData: { destination: string; weight: number; priority: string },
  availableFleet: Array<{ id: string; currentLocation: string; capacity: number; type: string }>
): OptimizationResult | null {
  if (availableFleet.length === 0) return null;

  let bestFleet = null;
  let bestScore = -1;

  const priorityWeights = {
    'Low': 1,
    'Medium': 1.2,
    'High': 1.5,
    'Urgent': 2
  };

  availableFleet.forEach(fleet => {
    const distance = calculateDistance(fleet.currentLocation, packageData.destination);
    const capacityUtilization = packageData.weight / fleet.capacity;
    const priorityWeight = priorityWeights[packageData.priority as keyof typeof priorityWeights] || 1;

    // Scoring algorithm (higher is better)
    const distanceScore = Math.max(0, 1000 - distance) / 1000; // Favor shorter distances
    const capacityScore = Math.min(capacityUtilization * 2, 1); // Favor better capacity utilization
    const availabilityScore = 1; // All considered fleet are available

    const totalScore = (distanceScore * 0.4 + capacityScore * 0.3 + availabilityScore * 0.3) * priorityWeight;

    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestFleet = fleet;
    }
  });

  if (bestFleet) {
    const distance = calculateDistance(bestFleet.currentLocation, packageData.destination);
    return {
      fleetId: bestFleet.id,
      distance,
      score: bestScore,
      reason: `Optimal fleet selected based on distance (${distance.toFixed(1)}km), capacity utilization, and priority weighting`
    };
  }

  return null;
}

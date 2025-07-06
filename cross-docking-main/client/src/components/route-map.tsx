import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Navigation } from "lucide-react";
import { cityCoordinates } from "@/lib/cities";

interface RouteMapProps {
  fromCity: string;
  toCity: string;
  distance: number;
}

export default function RouteMap({ fromCity, toCity, distance }: RouteMapProps) {
  const fromCoords = cityCoordinates[fromCity];
  const toCoords = cityCoordinates[toCity];
  
  if (!fromCoords || !toCoords) {
    return null;
  }

  // Calculate SVG positions (normalized to 0-300 range)
  const svgWidth = 300;
  const svgHeight = 200;
  
  // Normalize coordinates to India's approximate bounds
  const minLat = 8, maxLat = 35;
  const minLon = 68, maxLon = 98;
  
  const fromX = ((fromCoords.lon - minLon) / (maxLon - minLon)) * svgWidth;
  const fromY = svgHeight - ((fromCoords.lat - minLat) / (maxLat - minLat)) * svgHeight;
  const toX = ((toCoords.lon - minLon) / (maxLon - minLon)) * svgWidth;
  const toY = svgHeight - ((toCoords.lat - minLat) / (maxLat - minLat)) * svgHeight;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-sm">
          <Navigation className="h-4 w-4 mr-2" />
          Route Visualization
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="bg-muted/30 rounded-lg p-3">
            <svg width={svgWidth} height={svgHeight} className="border rounded">
              {/* India outline (simplified) */}
              <rect x="0" y="0" width={svgWidth} height={svgHeight} fill="#f8f9fa" stroke="#e9ecef" />
              
              {/* Route line */}
              <line 
                x1={fromX} 
                y1={fromY} 
                x2={toX} 
                y2={toY} 
                stroke="#3b82f6" 
                strokeWidth="2"
                strokeDasharray="5,5"
              />
              
              {/* From city marker */}
              <circle 
                cx={fromX} 
                cy={fromY} 
                r="6" 
                fill="#10b981" 
                stroke="#065f46" 
                strokeWidth="2"
              />
              
              {/* To city marker */}
              <circle 
                cx={toX} 
                cy={toY} 
                r="6" 
                fill="#ef4444" 
                stroke="#7f1d1d" 
                strokeWidth="2"
              />
              
              {/* City labels */}
              <text 
                x={fromX} 
                y={fromY - 10} 
                fontSize="10" 
                textAnchor="middle" 
                fill="#065f46"
                fontWeight="bold"
              >
                {fromCity}
              </text>
              <text 
                x={toX} 
                y={toY - 10} 
                fontSize="10" 
                textAnchor="middle" 
                fill="#7f1d1d"
                fontWeight="bold"
              >
                {toCity}
              </text>
            </svg>
          </div>
          
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <div className="flex items-center justify-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Origin</span>
            </div>
            <div className="flex items-center justify-center space-x-1">
              <div className="w-4 h-0.5 bg-blue-500 border-dashed"></div>
              <span>{distance.toFixed(0)}km</span>
            </div>
            <div className="flex items-center justify-center space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Destination</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
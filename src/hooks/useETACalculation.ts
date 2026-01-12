import { useState, useCallback } from "react";

// Average speed assumptions in km/h
const AVERAGE_SPEEDS = {
  motorcycle: 25, // accounting for traffic in Dhaka
  bicycle: 12,
  van: 20,
};

interface ETAResult {
  distanceKm: number;
  durationMinutes: number;
  formattedETA: string;
  arrivalTime: Date;
}

// Haversine formula for calculating distance between two points
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const useETACalculation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateETA = useCallback(
    (
      riderLat: number,
      riderLng: number,
      destLat: number,
      destLng: number,
      vehicleType: string = "motorcycle"
    ): ETAResult | null => {
      try {
        setLoading(true);
        setError(null);

        // Calculate straight-line distance
        const straightDistance = calculateDistance(riderLat, riderLng, destLat, destLng);
        
        // Apply road factor (roads are typically 1.3-1.5x longer than straight line)
        const roadFactor = 1.4;
        const distanceKm = straightDistance * roadFactor;

        // Get average speed for vehicle type
        const speed = AVERAGE_SPEEDS[vehicleType as keyof typeof AVERAGE_SPEEDS] || AVERAGE_SPEEDS.motorcycle;

        // Calculate duration in minutes
        const durationHours = distanceKm / speed;
        const durationMinutes = Math.round(durationHours * 60);

        // Calculate arrival time
        const arrivalTime = new Date();
        arrivalTime.setMinutes(arrivalTime.getMinutes() + durationMinutes);

        // Format ETA
        let formattedETA: string;
        if (durationMinutes < 1) {
          formattedETA = "Arriving now";
        } else if (durationMinutes < 60) {
          formattedETA = `${durationMinutes} min`;
        } else {
          const hours = Math.floor(durationMinutes / 60);
          const mins = durationMinutes % 60;
          formattedETA = mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
        }

        setLoading(false);
        return {
          distanceKm: Math.round(distanceKm * 10) / 10,
          durationMinutes,
          formattedETA,
          arrivalTime,
        };
      } catch (err) {
        setError("Failed to calculate ETA");
        setLoading(false);
        return null;
      }
    },
    []
  );

  const formatArrivalTime = (date: Date): string => {
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isNearDestination = (distanceKm: number, thresholdKm: number = 0.5): boolean => {
    return distanceKm <= thresholdKm;
  };

  return {
    calculateETA,
    formatArrivalTime,
    isNearDestination,
    loading,
    error,
  };
};

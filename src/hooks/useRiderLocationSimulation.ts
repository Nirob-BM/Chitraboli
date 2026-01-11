import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SimulationState {
  riderId: string;
  isRunning: boolean;
  currentStep: number;
  totalSteps: number;
}

// Sample delivery routes in Dhaka area
const SAMPLE_ROUTES = [
  // Route 1: Gulshan to Banani
  [
    { lat: 23.7925, lng: 90.4078 }, // Start - Gulshan 1
    { lat: 23.7935, lng: 90.4085 },
    { lat: 23.7945, lng: 90.4092 },
    { lat: 23.7958, lng: 90.4100 },
    { lat: 23.7970, lng: 90.4108 },
    { lat: 23.7985, lng: 90.4115 },
    { lat: 23.7998, lng: 90.4120 },
    { lat: 23.8010, lng: 90.4125 }, // End - Banani
  ],
  // Route 2: Dhanmondi to Uttara
  [
    { lat: 23.7461, lng: 90.3742 }, // Start - Dhanmondi
    { lat: 23.7550, lng: 90.3780 },
    { lat: 23.7650, lng: 90.3820 },
    { lat: 23.7750, lng: 90.3860 },
    { lat: 23.7850, lng: 90.3900 },
    { lat: 23.7950, lng: 90.3940 },
    { lat: 23.8050, lng: 90.3980 },
    { lat: 23.8150, lng: 90.4020 },
    { lat: 23.8250, lng: 90.4060 },
    { lat: 23.8350, lng: 90.4100 },
    { lat: 23.8450, lng: 90.4140 },
    { lat: 23.8550, lng: 90.4180 }, // End - Uttara
  ],
  // Route 3: Mirpur to Mohammadpur
  [
    { lat: 23.8041, lng: 90.3522 }, // Start - Mirpur
    { lat: 23.8000, lng: 90.3560 },
    { lat: 23.7950, lng: 90.3600 },
    { lat: 23.7900, lng: 90.3640 },
    { lat: 23.7850, lng: 90.3680 },
    { lat: 23.7800, lng: 90.3720 },
    { lat: 23.7750, lng: 90.3760 },
    { lat: 23.7700, lng: 90.3800 }, // End - Mohammadpur
  ],
];

export const useRiderLocationSimulation = () => {
  const [simulations, setSimulations] = useState<Map<string, SimulationState>>(new Map());
  const intervalRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const startSimulation = useCallback(async (riderId: string, intervalMs: number = 3000) => {
    // Stop any existing simulation for this rider
    if (intervalRefs.current.has(riderId)) {
      clearInterval(intervalRefs.current.get(riderId)!);
    }

    // Pick a random route
    const route = SAMPLE_ROUTES[Math.floor(Math.random() * SAMPLE_ROUTES.length)];
    let currentStep = 0;

    // Set initial position
    const initialPoint = route[0];
    await supabase
      .from("delivery_riders")
      .update({
        current_latitude: initialPoint.lat,
        current_longitude: initialPoint.lng,
        location_updated_at: new Date().toISOString(),
      })
      .eq("id", riderId);

    setSimulations(prev => {
      const newMap = new Map(prev);
      newMap.set(riderId, {
        riderId,
        isRunning: true,
        currentStep: 0,
        totalSteps: route.length,
      });
      return newMap;
    });

    // Start the simulation interval
    const intervalId = setInterval(async () => {
      currentStep++;

      if (currentStep >= route.length) {
        // Simulation complete - loop back to start
        currentStep = 0;
      }

      const point = route[currentStep];
      
      // Add small random variation to make it more realistic
      const jitter = 0.0002;
      const lat = point.lat + (Math.random() - 0.5) * jitter;
      const lng = point.lng + (Math.random() - 0.5) * jitter;

      await supabase
        .from("delivery_riders")
        .update({
          current_latitude: lat,
          current_longitude: lng,
          location_updated_at: new Date().toISOString(),
        })
        .eq("id", riderId);

      setSimulations(prev => {
        const newMap = new Map(prev);
        const existing = newMap.get(riderId);
        if (existing) {
          newMap.set(riderId, {
            ...existing,
            currentStep,
          });
        }
        return newMap;
      });
    }, intervalMs);

    intervalRefs.current.set(riderId, intervalId);
  }, []);

  const stopSimulation = useCallback((riderId: string) => {
    if (intervalRefs.current.has(riderId)) {
      clearInterval(intervalRefs.current.get(riderId)!);
      intervalRefs.current.delete(riderId);
    }

    setSimulations(prev => {
      const newMap = new Map(prev);
      newMap.delete(riderId);
      return newMap;
    });
  }, []);

  const stopAllSimulations = useCallback(() => {
    intervalRefs.current.forEach((intervalId) => {
      clearInterval(intervalId);
    });
    intervalRefs.current.clear();
    setSimulations(new Map());
  }, []);

  const isSimulating = useCallback((riderId: string) => {
    return simulations.has(riderId) && simulations.get(riderId)?.isRunning;
  }, [simulations]);

  const getSimulationState = useCallback((riderId: string) => {
    return simulations.get(riderId);
  }, [simulations]);

  return {
    simulations,
    startSimulation,
    stopSimulation,
    stopAllSimulations,
    isSimulating,
    getSimulationState,
  };
};

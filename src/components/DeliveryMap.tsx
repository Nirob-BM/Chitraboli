import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DeliveryMapProps {
  riderId: string;
  riderName: string;
  destinationAddress?: string;
}

interface RiderLocation {
  latitude: number;
  longitude: number;
  updatedAt: string | null;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN;

// Default location (Dhaka, Bangladesh)
const DEFAULT_LOCATION = { lat: 23.8103, lng: 90.4125 };

const DeliveryMap: React.FC<DeliveryMapProps> = ({ riderId, riderName, destinationAddress }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [riderLocation, setRiderLocation] = useState<RiderLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial rider location
  useEffect(() => {
    const fetchRiderLocation = async () => {
      try {
        const { data, error } = await supabase
          .from('delivery_riders')
          .select('current_latitude, current_longitude, location_updated_at')
          .eq('id', riderId)
          .single();

        if (error) throw error;

        if (data && data.current_latitude && data.current_longitude) {
          setRiderLocation({
            latitude: Number(data.current_latitude),
            longitude: Number(data.current_longitude),
            updatedAt: data.location_updated_at
          });
        }
      } catch (err) {
        console.error('Error fetching rider location:', err);
        setError('Unable to fetch rider location');
      } finally {
        setLoading(false);
      }
    };

    fetchRiderLocation();
  }, [riderId]);

  // Subscribe to real-time location updates
  useEffect(() => {
    const channel = supabase
      .channel(`rider-location-${riderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'delivery_riders',
          filter: `id=eq.${riderId}`
        },
        (payload) => {
          const newData = payload.new as any;
          if (newData.current_latitude && newData.current_longitude) {
            const newLocation = {
              latitude: parseFloat(newData.current_latitude),
              longitude: parseFloat(newData.current_longitude),
              updatedAt: newData.location_updated_at
            };
            setRiderLocation(newLocation);

            // Update marker position
            if (marker.current && map.current) {
              marker.current.setLngLat([newLocation.longitude, newLocation.latitude]);
              map.current.flyTo({
                center: [newLocation.longitude, newLocation.latitude],
                duration: 1000
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [riderId]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const initialCenter = riderLocation
      ? [riderLocation.longitude, riderLocation.latitude]
      : [DEFAULT_LOCATION.lng, DEFAULT_LOCATION.lat];

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      zoom: 14,
      center: initialCenter as [number, number],
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: true }),
      'top-right'
    );

    // Add fullscreen control
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    // Create custom marker element
    const markerEl = document.createElement('div');
    markerEl.className = 'rider-marker';
    markerEl.innerHTML = `
      <div class="relative">
        <div class="absolute -top-1 -left-1 w-10 h-10 bg-primary/30 rounded-full animate-ping"></div>
        <div class="relative w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg border-2 border-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="18.5" cy="17.5" r="3.5"/>
            <circle cx="5.5" cy="17.5" r="3.5"/>
            <circle cx="15" cy="5" r="1"/>
            <path d="M12 17.5V14l-3-3 4-3 2 3h2"/>
          </svg>
        </div>
      </div>
    `;

    // Add marker
    marker.current = new mapboxgl.Marker({ element: markerEl })
      .setLngLat(initialCenter as [number, number])
      .setPopup(
        new mapboxgl.Popup({ offset: 25 }).setHTML(
          `<div class="font-semibold text-gray-900">${riderName}</div>
           <div class="text-xs text-gray-600">Delivery in progress</div>`
        )
      )
      .addTo(map.current);

    return () => {
      map.current?.remove();
    };
  }, [MAPBOX_TOKEN]);

  // Update marker when location changes
  useEffect(() => {
    if (marker.current && map.current && riderLocation) {
      marker.current.setLngLat([riderLocation.longitude, riderLocation.latitude]);
      map.current.flyTo({
        center: [riderLocation.longitude, riderLocation.latitude],
        duration: 1000
      });
    }
  }, [riderLocation]);

  const formatLastUpdate = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  if (!MAPBOX_TOKEN) {
    return (
      <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Map configuration required</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {/* Map Container */}
      <div 
        ref={mapContainer} 
        className="w-full h-64 md:h-80 rounded-lg overflow-hidden shadow-inner"
      />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
          <RefreshCw className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {/* Location Info */}
      <div className="absolute bottom-3 left-3 right-3 bg-background/95 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium">Live Tracking</span>
          </div>
          {riderLocation?.updatedAt && (
            <span className="text-xs text-muted-foreground">
              Updated {formatLastUpdate(riderLocation.updatedAt)}
            </span>
          )}
        </div>
        {!riderLocation && !loading && (
          <p className="text-xs text-muted-foreground mt-1">
            Waiting for rider location...
          </p>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="absolute top-3 left-3 right-3 bg-destructive/10 text-destructive text-sm p-2 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
};

export default DeliveryMap;

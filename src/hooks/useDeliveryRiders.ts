import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DeliveryRider {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  vehicle_type: string;
  license_number: string | null;
  is_active: boolean;
  current_status: 'available' | 'on_delivery' | 'offline';
  profile_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface RiderDelivery {
  id: string;
  rider_id: string;
  order_id: string;
  assigned_at: string;
  picked_up_at: string | null;
  delivered_at: string | null;
  status: string;
  notes: string | null;
}

export const useDeliveryRiders = () => {
  const [riders, setRiders] = useState<DeliveryRider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRiders = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("delivery_riders")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setRiders((data || []) as DeliveryRider[]);
    } catch (err: any) {
      console.error("Error fetching riders:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRiders();
  }, [fetchRiders]);

  const addRider = async (rider: Omit<DeliveryRider, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from("delivery_riders")
        .insert(rider)
        .select()
        .single();

      if (error) throw error;
      setRiders(prev => [...prev, data as DeliveryRider]);
      return { success: true, data };
    } catch (err: any) {
      console.error("Error adding rider:", err);
      return { success: false, error: err.message };
    }
  };

  const updateRider = async (id: string, updates: Partial<DeliveryRider>) => {
    try {
      const { error } = await supabase
        .from("delivery_riders")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      setRiders(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
      return { success: true };
    } catch (err: any) {
      console.error("Error updating rider:", err);
      return { success: false, error: err.message };
    }
  };

  const deleteRider = async (id: string) => {
    try {
      const { error } = await supabase
        .from("delivery_riders")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setRiders(prev => prev.filter(r => r.id !== id));
      return { success: true };
    } catch (err: any) {
      console.error("Error deleting rider:", err);
      return { success: false, error: err.message };
    }
  };

  const assignRiderToOrder = async (orderId: string, riderId: string, notes?: string) => {
    try {
      // Update order with rider assignment
      const { error: orderError } = await supabase
        .from("orders")
        .update({ 
          assigned_rider_id: riderId,
          rider_assigned_at: new Date().toISOString(),
          delivery_notes: notes || null
        })
        .eq("id", orderId);

      if (orderError) throw orderError;

      // Create delivery record
      const { error: deliveryError } = await supabase
        .from("rider_deliveries")
        .insert({
          rider_id: riderId,
          order_id: orderId,
          status: 'assigned',
          notes: notes || null
        });

      if (deliveryError) throw deliveryError;

      // Update rider status
      await supabase
        .from("delivery_riders")
        .update({ current_status: 'on_delivery' })
        .eq("id", riderId);

      return { success: true };
    } catch (err: any) {
      console.error("Error assigning rider:", err);
      return { success: false, error: err.message };
    }
  };

  const unassignRider = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ 
          assigned_rider_id: null,
          rider_assigned_at: null,
          delivery_notes: null
        })
        .eq("id", orderId);

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      console.error("Error unassigning rider:", err);
      return { success: false, error: err.message };
    }
  };

  const getAvailableRiders = () => {
    return riders.filter(r => r.is_active && r.current_status === 'available');
  };

  const updateRiderLocation = async (riderId: string, latitude: number, longitude: number) => {
    try {
      const { error } = await supabase
        .from("delivery_riders")
        .update({ 
          current_latitude: latitude,
          current_longitude: longitude,
          location_updated_at: new Date().toISOString()
        })
        .eq("id", riderId);

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      console.error("Error updating rider location:", err);
      return { success: false, error: err.message };
    }
  };

  return {
    riders,
    loading,
    error,
    addRider,
    updateRider,
    deleteRider,
    assignRiderToOrder,
    unassignRider,
    getAvailableRiders,
    updateRiderLocation,
    refetch: fetchRiders,
  };
};

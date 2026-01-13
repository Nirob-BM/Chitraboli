import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  category?: string;
  size?: string;
  color?: string;
}

export interface UserOrder {
  id: string;
  user_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  items: OrderItem[];
  total_amount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  payment_method: string | null;
  transaction_id: string | null;
  delivery_notes: string | null;
  assigned_rider_id: string | null;
  rider_assigned_at: string | null;
  created_at: string;
  // Joined rider data
  rider?: {
    name: string;
    phone: string;
    vehicle_type: string;
  };
}

export function useUserOrders() {
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchOrders = useCallback(async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          rider:delivery_riders(name, phone, vehicle_type)
        `)
        .eq('user_id', uid)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Parse items JSON
      const parsedOrders = data.map(order => ({
        ...order,
        items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items
      })) as UserOrder[];
      
      setOrders(parsedOrders);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      if (uid) {
        fetchOrders(uid);
      } else {
        setOrders([]);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      if (uid) {
        fetchOrders(uid);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchOrders]);

  const getOrdersByStatus = (status: UserOrder['status']) => {
    return orders.filter(o => o.status === status);
  };

  const getActiveOrders = () => {
    return orders.filter(o => !['delivered', 'cancelled', 'returned'].includes(o.status));
  };

  const getCompletedOrders = () => {
    return orders.filter(o => o.status === 'delivered');
  };

  const getTotalSpent = () => {
    return orders
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + o.total_amount, 0);
  };

  const getOrderStats = () => {
    return {
      total: orders.length,
      active: getActiveOrders().length,
      completed: getCompletedOrders().length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      totalSpent: getTotalSpent()
    };
  };

  return {
    orders,
    loading,
    getOrdersByStatus,
    getActiveOrders,
    getCompletedOrders,
    getTotalSpent,
    getOrderStats,
    refetch: () => userId && fetchOrders(userId)
  };
}

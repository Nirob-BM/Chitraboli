import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Customer {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  address: string | null;
  total_orders: number;
  total_spent: number;
  is_blocked: boolean;
  block_reason: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface CustomerNote {
  id: string;
  customer_email: string;
  customer_phone: string | null;
  note: string;
  note_type: string;
  created_by: string | null;
  created_at: string;
}

export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Customers could not be loaded");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const syncCustomersFromOrders = async () => {
    try {
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("customer_name, customer_email, customer_phone, customer_address, total_amount");

      if (ordersError) throw ordersError;

      const customerMap = new Map<string, {
        email: string;
        phone: string;
        name: string;
        address: string;
        total_orders: number;
        total_spent: number;
      }>();

      (orders || []).forEach(order => {
        const key = order.customer_email.toLowerCase();
        const existing = customerMap.get(key);
        
        if (existing) {
          existing.total_orders += 1;
          existing.total_spent += Number(order.total_amount) || 0;
        } else {
          customerMap.set(key, {
            email: order.customer_email,
            phone: order.customer_phone,
            name: order.customer_name,
            address: order.customer_address,
            total_orders: 1,
            total_spent: Number(order.total_amount) || 0,
          });
        }
      });

      for (const [email, customer] of customerMap) {
        const { data: existing } = await supabase
          .from("customers")
          .select("id")
          .eq("email", email)
          .single();

        if (existing) {
          await supabase
            .from("customers")
            .update({
              total_orders: customer.total_orders,
              total_spent: customer.total_spent,
            })
            .eq("id", existing.id);
        } else {
          await supabase
            .from("customers")
            .insert(customer);
        }
      }

      fetchCustomers();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const blockCustomer = async (id: string, reason: string) => {
    try {
      const { error } = await supabase
        .from("customers")
        .update({ is_blocked: true, block_reason: reason })
        .eq("id", id);

      if (error) throw error;
      
      setCustomers(prev => prev.map(c => 
        c.id === id ? { ...c, is_blocked: true, block_reason: reason } : c
      ));
      
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const unblockCustomer = async (id: string) => {
    try {
      const { error } = await supabase
        .from("customers")
        .update({ is_blocked: false, block_reason: null })
        .eq("id", id);

      if (error) throw error;
      
      setCustomers(prev => prev.map(c => 
        c.id === id ? { ...c, is_blocked: false, block_reason: null } : c
      ));
      
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const addCustomerNote = async (
    customer: { email: string | null; phone: string | null },
    note: string,
    noteType: string = 'general'
  ): Promise<{ success: boolean; error?: string; data?: CustomerNote }> => {
    try {
      const key = customer.email || customer.phone;
      if (!key) throw new Error("This customer has no email or phone to attach the note to");
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("customer_notes")
        .insert({
          customer_email: key,
          customer_phone: customer.phone,
          note: note.trim(),
          note_type: noteType,
          created_by: user?.id || null,
        })
        .select("*")
        .single();

      if (error) throw error;
      if (!data) throw new Error("The note was not saved");
      return { success: true, data: data as CustomerNote };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const getCustomerNotes = async (customer: { email: string | null; phone: string | null }) => {
    try {
      const key = customer.email || customer.phone;
      if (!key) return { success: true, data: [] as CustomerNote[] };
      const { data, error } = await supabase
        .from("customer_notes")
        .select("*")
        .eq("customer_email", key)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return { success: true, data: (data || []) as CustomerNote[] };
    } catch (err: any) {
      return { success: false, error: err.message, data: [] as CustomerNote[] };
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      // Removes the customer record, their notes and messages, and anonymizes their past orders.
      const { data, error } = await supabase.rpc("admin_erase_customer_data", { _customer_id: id });
      if (error) throw error;

      setCustomers(prev => prev.filter(c => c.id !== id));
      return { success: true, result: data as { orders_anonymized: number; notes_deleted: number; messages_deleted: number } };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return {
    customers,
    loading,
    error,
    syncCustomersFromOrders,
    blockCustomer,
    unblockCustomer,
    addCustomerNote,
    getCustomerNotes,
    deleteCustomer,
    refetch: fetchCustomers,
  };
};

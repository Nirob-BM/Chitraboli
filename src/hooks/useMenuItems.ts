import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface MenuItem {
  id: string;
  menu_location: string;
  label: string;
  url: string;
  icon: string | null;
  parent_id: string | null;
  display_order: number;
  is_visible: boolean;
  open_in_new_tab: boolean;
}

export const useMenuItems = (location?: string) => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      let query = supabase
        .from("menu_items")
        .select("*")
        .order("display_order", { ascending: true });

      if (location) {
        query = query.eq("menu_location", location);
      }

      const { data, error } = await query;

      if (error) throw error;
      setItems(data || []);
    } catch (err: any) {
      console.error("Error fetching menu items:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [location]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const getVisibleItems = useCallback(() => {
    return items.filter(item => item.is_visible);
  }, [items]);

  const addItem = async (item: Omit<MenuItem, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from("menu_items")
        .insert(item)
        .select()
        .single();

      if (error) throw error;
      
      setItems(prev => [...prev, data]);
      return { success: true, data };
    } catch (err: any) {
      console.error("Error adding menu item:", err);
      return { success: false, error: err.message };
    }
  };

  const updateItem = async (id: string, updates: Partial<MenuItem>) => {
    try {
      const { error } = await supabase
        .from("menu_items")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      
      setItems(prev => prev.map(item => 
        item.id === id ? { ...item, ...updates } : item
      ));
      
      return { success: true };
    } catch (err: any) {
      console.error("Error updating menu item:", err);
      return { success: false, error: err.message };
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from("menu_items")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setItems(prev => prev.filter(item => item.id !== id));
      return { success: true };
    } catch (err: any) {
      console.error("Error deleting menu item:", err);
      return { success: false, error: err.message };
    }
  };

  const reorderItems = async (newOrder: { id: string; display_order: number }[]) => {
    try {
      for (const item of newOrder) {
        await supabase
          .from("menu_items")
          .update({ display_order: item.display_order })
          .eq("id", item.id);
      }
      
      fetchItems();
      return { success: true };
    } catch (err: any) {
      console.error("Error reordering menu items:", err);
      return { success: false, error: err.message };
    }
  };

  return {
    items,
    loading,
    error,
    getVisibleItems,
    addItem,
    updateItem,
    deleteItem,
    reorderItems,
    refetch: fetchItems,
  };
};

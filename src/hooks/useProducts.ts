import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  images: string[] | null;
  category: string;
  description: string | null;
  featured: boolean;
  in_stock: boolean;
  sizes: string[] | null;
  colors: string[] | null;
  stock_quantity: number | null;
  sku: string | null;
}

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();

    // Subscribe to realtime updates (unique channel name to avoid re-subscribe conflicts in StrictMode)
    const channel = supabase
      .channel(`products-public-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchProducts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, image_url, images, category, description, featured, in_stock, sizes, colors, stock_quantity, sku")
        .eq("in_stock", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const getFeaturedProducts = () => products.filter((p) => p.featured);
  
  const getCategories = () => {
    const categoryMap = new Map<string, number>();
    products.forEach((p) => {
      categoryMap.set(p.category, (categoryMap.get(p.category) || 0) + 1);
    });
    return Array.from(categoryMap.entries()).map(([name, count]) => ({ name, count }));
  };

  return {
    products,
    loading,
    error,
    getFeaturedProducts,
    getCategories,
    refetch: fetchProducts,
  };
};

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  added_at: string;
  price_at_add: number | null;
  notify_price_drop: boolean;
  notify_stock: boolean;
  // Joined product data
  product?: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    category: string;
    in_stock: boolean;
  };
}

export function useWishlist() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchWishlist = useCallback(async (uid: string) => {
    try {
      // Fetch wishlist items
      const { data: wishlistData, error: wishlistError } = await supabase
        .from('wishlist')
        .select('*')
        .eq('user_id', uid)
        .order('added_at', { ascending: false });

      if (wishlistError) throw wishlistError;

      // Fetch product details for each wishlist item
      if (wishlistData && wishlistData.length > 0) {
        const productIds = wishlistData.map(item => item.product_id);
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('id, name, price, image_url, category, in_stock')
          .in('id', productIds);

        if (productsError) throw productsError;

        const itemsWithProducts = wishlistData.map(item => ({
          ...item,
          product: productsData?.find(p => p.id === item.product_id)
        })) as WishlistItem[];

        setItems(itemsWithProducts);
      } else {
        setItems([]);
      }
    } catch (err: any) {
      console.error('Error fetching wishlist:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      if (uid) {
        fetchWishlist(uid);
      } else {
        setItems([]);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      if (uid) {
        fetchWishlist(uid);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchWishlist]);

  const addToWishlist = async (productId: string, currentPrice?: number) => {
    if (!userId) {
      toast.error('Please login to add items to wishlist');
      return { error: 'Not authenticated' };
    }

    try {
      const { error } = await supabase
        .from('wishlist')
        .insert({
          user_id: userId,
          product_id: productId,
          price_at_add: currentPrice
        });

      if (error) {
        if (error.code === '23505') {
          toast.info('Item is already in your wishlist');
          return { error: 'Already in wishlist' };
        }
        throw error;
      }

      await fetchWishlist(userId);
      toast.success('Added to wishlist');
      return { error: null };
    } catch (err: any) {
      toast.error('Failed to add to wishlist');
      return { error: err.message };
    }
  };

  const removeFromWishlist = async (productId: string) => {
    if (!userId) return { error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId);

      if (error) throw error;

      setItems(prev => prev.filter(item => item.product_id !== productId));
      toast.success('Removed from wishlist');
      return { error: null };
    } catch (err: any) {
      toast.error('Failed to remove from wishlist');
      return { error: err.message };
    }
  };

  const isInWishlist = (productId: string) => {
    return items.some(item => item.product_id === productId);
  };

  const toggleWishlist = async (productId: string, currentPrice?: number) => {
    if (isInWishlist(productId)) {
      return removeFromWishlist(productId);
    } else {
      return addToWishlist(productId, currentPrice);
    }
  };

  const updateNotifications = async (productId: string, priceDrops: boolean, stock: boolean) => {
    if (!userId) return { error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('wishlist')
        .update({
          notify_price_drop: priceDrops,
          notify_stock: stock
        })
        .eq('user_id', userId)
        .eq('product_id', productId);

      if (error) throw error;

      setItems(prev => prev.map(item => 
        item.product_id === productId 
          ? { ...item, notify_price_drop: priceDrops, notify_stock: stock }
          : item
      ));
      toast.success('Notification preferences updated');
      return { error: null };
    } catch (err: any) {
      toast.error('Failed to update preferences');
      return { error: err.message };
    }
  };

  const getPriceChanges = () => {
    return items.filter(item => {
      if (!item.product || item.price_at_add === null) return false;
      return item.product.price < item.price_at_add;
    }).map(item => ({
      ...item,
      priceDrop: item.price_at_add! - item.product!.price,
      priceDropPercent: ((item.price_at_add! - item.product!.price) / item.price_at_add!) * 100
    }));
  };

  return {
    items,
    loading,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    toggleWishlist,
    updateNotifications,
    getPriceChanges,
    refetch: () => userId && fetchWishlist(userId)
  };
}

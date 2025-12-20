import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "chitraboli-session";

// Initialize session ID on first load
const getOrCreateSessionId = (): string => {
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
};

export interface CartItem {
  id: string;
  product_id: string;
  product_name: string;
  product_price: number;
  product_image: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Omit<CartItem, "id" | "quantity">) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "chitraboli-cart";

// Ensure session is initialized
getOrCreateSessionId();

// Helper to get/set localStorage cart
const getLocalCart = (): CartItem[] => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const setLocalCart = (items: CartItem[]) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Check auth state
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      const newUserId = session?.user?.id || null;
      setUserId(newUserId);
      
      // If user just logged in, merge local cart with DB cart
      if (newUserId) {
        mergeLocalCartToDb(newUserId);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load cart based on auth state
  useEffect(() => {
    if (userId) {
      loadDbCart(userId);
    } else {
      setItems(getLocalCart());
    }
  }, [userId]);

  const loadDbCart = async (uid: string) => {
    const { data, error } = await supabase
      .from("cart_items")
      .select("*")
      .eq("user_id", uid);

    if (!error && data) {
      setItems(data.map((item) => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_price: Number(item.product_price),
        product_image: item.product_image || "",
        quantity: item.quantity,
      })));
    }
  };

  const mergeLocalCartToDb = async (uid: string) => {
    const localItems = getLocalCart();
    if (localItems.length === 0) {
      loadDbCart(uid);
      return;
    }

    // Get existing DB cart
    const { data: dbItems } = await supabase
      .from("cart_items")
      .select("*")
      .eq("user_id", uid);

    // Merge local items into DB
    for (const localItem of localItems) {
      const existingDbItem = dbItems?.find(i => i.product_id === localItem.product_id);
      
      if (existingDbItem) {
        // Update quantity
        await supabase
          .from("cart_items")
          .update({ quantity: existingDbItem.quantity + localItem.quantity })
          .eq("id", existingDbItem.id);
      } else {
        // Insert new item
        await supabase
          .from("cart_items")
          .insert({
            user_id: uid,
            product_id: localItem.product_id,
            product_name: localItem.product_name,
            product_price: localItem.product_price,
            product_image: localItem.product_image,
            quantity: localItem.quantity,
            session_id: uid // Use user_id as session_id for authenticated users
          });
      }
    }

    // Clear local storage after merge
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    
    // Reload from DB
    loadDbCart(uid);
  };

  const addItem = async (product: Omit<CartItem, "id" | "quantity">) => {
    const existingItem = items.find((item) => item.product_id === product.product_id);

    if (userId) {
      // Authenticated: use database
      if (existingItem) {
        await updateQuantity(product.product_id, existingItem.quantity + 1);
      } else {
        const { data, error } = await supabase
          .from("cart_items")
          .insert({
            user_id: userId,
            session_id: userId,
            product_id: product.product_id,
            product_name: product.product_name,
            product_price: product.product_price,
            product_image: product.product_image,
            quantity: 1,
          })
          .select()
          .single();

        if (!error && data) {
          setItems((prev) => [...prev, {
            id: data.id,
            product_id: data.product_id,
            product_name: data.product_name,
            product_price: Number(data.product_price),
            product_image: data.product_image || "",
            quantity: data.quantity,
          }]);
        }
      }
    } else {
      // Anonymous: use localStorage
      if (existingItem) {
        const updatedItems = items.map((item) =>
          item.product_id === product.product_id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
        setItems(updatedItems);
        setLocalCart(updatedItems);
      } else {
        const newItem: CartItem = {
          id: crypto.randomUUID(),
          ...product,
          quantity: 1,
        };
        const updatedItems = [...items, newItem];
        setItems(updatedItems);
        setLocalCart(updatedItems);
      }
    }
    setIsOpen(true);
  };

  const removeItem = async (productId: string) => {
    if (userId) {
      await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", userId)
        .eq("product_id", productId);
    }

    const updatedItems = items.filter((item) => item.product_id !== productId);
    setItems(updatedItems);
    
    if (!userId) {
      setLocalCart(updatedItems);
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(productId);
      return;
    }

    if (userId) {
      await supabase
        .from("cart_items")
        .update({ quantity, updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("product_id", productId);
    }

    const updatedItems = items.map((item) =>
      item.product_id === productId ? { ...item, quantity } : item
    );
    setItems(updatedItems);
    
    if (!userId) {
      setLocalCart(updatedItems);
    }
  };

  const clearCart = async () => {
    if (userId) {
      await supabase.from("cart_items").delete().eq("user_id", userId);
    }
    setItems([]);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.product_price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        isOpen,
        setIsOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
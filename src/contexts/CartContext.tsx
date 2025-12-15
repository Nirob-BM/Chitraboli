import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

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

const getSessionId = () => {
  let sessionId = localStorage.getItem("chitraboli-session");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem("chitraboli-session", sessionId);
  }
  return sessionId;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    const sessionId = getSessionId();
    const { data, error } = await supabase
      .from("cart_items")
      .select("*")
      .eq("session_id", sessionId);

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

  const addItem = async (product: Omit<CartItem, "id" | "quantity">) => {
    const sessionId = getSessionId();
    const existingItem = items.find((item) => item.product_id === product.product_id);

    if (existingItem) {
      await updateQuantity(product.product_id, existingItem.quantity + 1);
    } else {
      const { data, error } = await supabase
        .from("cart_items")
        .insert({
          session_id: sessionId,
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
    setIsOpen(true);
  };

  const removeItem = async (productId: string) => {
    const sessionId = getSessionId();
    await supabase
      .from("cart_items")
      .delete()
      .eq("session_id", sessionId)
      .eq("product_id", productId);

    setItems((prev) => prev.filter((item) => item.product_id !== productId));
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(productId);
      return;
    }

    const sessionId = getSessionId();
    await supabase
      .from("cart_items")
      .update({ quantity, updated_at: new Date().toISOString() })
      .eq("session_id", sessionId)
      .eq("product_id", productId);

    setItems((prev) =>
      prev.map((item) =>
        item.product_id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = async () => {
    const sessionId = getSessionId();
    await supabase.from("cart_items").delete().eq("session_id", sessionId);
    setItems([]);
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

"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useMemo,
} from "react";

type CartItem = {
  id: number;
  name: string;
  price: string; // ex : "29,90 €"
  quantity: number;
};

type CartContextType = {
  items: CartItem[];
  addItem: (item: { id: number; name: string; price: string }) => void;
  decreaseItem: (id: number) => void;
  removeItem: (id: number) => void;
  clearCart: () => void;
  totalQuantity: number;
  totalPrice: number; // en euros
};

const CartContext = createContext<CartContextType | undefined>(undefined);

function parsePrice(price: string): number {
  // "29,90 €" -> 29.9
  const normalized = price
    .replace(/\s/g, "")
    .replace("€", "")
    .replace(",", ".");
  const value = Number.parseFloat(normalized);
  return Number.isNaN(value) ? 0 : value;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (item: { id: number; name: string; price: string }) => {
    setItems((prev) => {
      const existing = prev.find((p) => p.id === item.id);
      if (existing) {
        return prev.map((p) =>
          p.id === item.id ? { ...p, quantity: p.quantity + 1 } : p
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const decreaseItem = (id: number) => {
    setItems((prev) => {
      const existing = prev.find((p) => p.id === id);
      if (!existing) return prev;
      // si la quantité tombe à 0, on retire l'article
      if (existing.quantity <= 1) {
        return prev.filter((p) => p.id !== id);
      }
      return prev.map((p) =>
        p.id === id ? { ...p, quantity: p.quantity - 1 } : p
      );
    });
  };

  const removeItem = (id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => setItems([]);

  const { totalQuantity, totalPrice } = useMemo(() => {
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce(
      (sum, item) => sum + parsePrice(item.price) * item.quantity,
      0
    );
    return { totalQuantity, totalPrice };
  }, [items]);

  const value: CartContextType = {
    items,
    addItem,
    decreaseItem,
    removeItem,
    clearCart,
    totalQuantity,
    totalPrice,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart doit être utilisé à l'intérieur de CartProvider");
  }
  return ctx;
}

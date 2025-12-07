"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useRef,
  useEffect,
  ReactNode,
} from "react";

type CartItem = {
  id: string;
  name: string;
  price: number; // en euros
  quantity: number;
  slug?: string;
  imageUrl?: string | null;
};

type AddItemInput = {
  id: string | number;
  name: string;
  price: number | string;
  slug?: string;
  imageUrl?: string | null;
};

type CartContextType = {
  items: CartItem[];
  addItem: (item: AddItemInput) => void;
  removeItem: (id: string | number) => void;
  increment: (id: string | number) => void;
  decrement: (id: string | number) => void;
  clearCart: () => void;
  totalQuantity: number;
  totalPrice: number;
  lastAddedName: string | null;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "mawaura_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [lastAddedName, setLastAddedName] = useState<string | null>(null);
  const lastAddedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  // 🔁 Chargement initial du panier depuis localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(CART_STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;

      const valid: CartItem[] = parsed
        .filter((item: any) => item && typeof item.id === "string")
        .map((item: any) => ({
          id: String(item.id),
          name: String(item.name ?? ""),
          price: typeof item.price === "number" ? item.price : 0,
          quantity:
            typeof item.quantity === "number" && item.quantity > 0
              ? item.quantity
              : 1,
          slug: item.slug ?? undefined,
          imageUrl:
            typeof item.imageUrl === "string" ? item.imageUrl : null,
        }));

      if (valid.length > 0) {
        setItems(valid);
      }
    } catch (error) {
      console.error("Erreur lors du chargement du panier depuis localStorage", error);
    }
  }, []);

  // 💾 Sauvegarde du panier à chaque modification
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(items)
      );
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du panier dans localStorage", error);
    }
  }, [items]);

  const normalizePrice = (price: number | string): number => {
    if (typeof price === "number") return price;

    const cleaned = price
      .replace(/\s/g, "")
      .replace("€", "")
      .replace(",", ".");
    const parsed = parseFloat(cleaned);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const addItem = (item: AddItemInput) => {
    const id = String(item.id);
    const price = normalizePrice(item.price);

    setItems((prev) => {
      const existing = prev.find((p) => p.id === id);
      if (existing) {
        return prev.map((p) =>
          p.id === id
            ? { ...p, quantity: p.quantity + 1 }
            : p
        );
      }
      return [
        ...prev,
        {
          id,
          name: item.name,
          price,
          quantity: 1,
          slug: item.slug,
          imageUrl: item.imageUrl ?? null,
        },
      ];
    });

    if (lastAddedTimeoutRef.current) {
      clearTimeout(lastAddedTimeoutRef.current);
    }
    setLastAddedName(item.name);
    lastAddedTimeoutRef.current = setTimeout(() => {
      setLastAddedName(null);
    }, 2000);
  };

  const increment = (id: string | number) => {
    const key = String(id);
    setItems((prev) =>
      prev.map((p) =>
        p.id === key ? { ...p, quantity: p.quantity + 1 } : p
      )
    );
  };

  const decrement = (id: string | number) => {
    const key = String(id);
    setItems((prev) =>
      prev
        .map((p) =>
          p.id === key ? { ...p, quantity: p.quantity - 1 } : p
        )
        .filter((p) => p.quantity > 0)
    );
  };

  const removeItem = (id: string | number) => {
    const key = String(id);
    setItems((prev) => prev.filter((p) => p.id !== key));
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalQuantity = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const totalPrice = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const value: CartContextType = {
    items,
    addItem,
    removeItem,
    increment,
    decrement,
    clearCart,
    totalQuantity,
    totalPrice,
    lastAddedName,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}

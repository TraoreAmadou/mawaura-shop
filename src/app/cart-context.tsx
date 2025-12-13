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
import { useSession } from "next-auth/react";

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

type ServerCartItem = {
  productId: string;
  quantity: number;
  name: string;
  slug: string;
  priceCents: number;
  mainImageUrl?: string | null;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [lastAddedName, setLastAddedName] = useState<string | null>(null);
  const lastAddedTimeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated" && !!session?.user?.email;

  const [hasLoadedFromServer, setHasLoadedFromServer] = useState(false);

  const normalizePrice = (price: number | string): number => {
    if (typeof price === "number") return price;

    const cleaned = price
      .replace(/\s/g, "")
      .replace("€", "")
      .replace(",", ".");
    const parsed = parseFloat(cleaned);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  // 🔹 Chargement du panier depuis le serveur à la connexion
  useEffect(() => {
    if (!isAuthenticated) {
      setHasLoadedFromServer(false);
      return;
    }

    let cancelled = false;

    const loadFromServer = async () => {
      try {
        const res = await fetch("/api/cart", { cache: "no-store" });
        if (!res.ok) {
          console.error("Erreur chargement panier serveur");
          return;
        }

        const data = (await res.json()) as ServerCartItem[];
        if (cancelled) return;

        const mapped: CartItem[] = data.map((it) => ({
          id: it.productId,
          name: it.name,
          price: it.priceCents / 100,
          quantity: it.quantity,
          slug: it.slug,
          imageUrl: it.mainImageUrl ?? null,
        }));

        setItems(mapped);
      } catch (error) {
        console.error("Erreur chargement panier serveur:", error);
      } finally {
        if (!cancelled) {
          setHasLoadedFromServer(true);
        }
      }
    };

    loadFromServer();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  // 🔹 Synchronisation du panier vers le serveur quand il change
  useEffect(() => {
    if (!isAuthenticated) return;
    if (!hasLoadedFromServer) return;

    const controller = new AbortController();

    const syncToServer = async () => {
      try {
        const payload = {
          items: items.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
          })),
        };

        await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      } catch (error: any) {
        if (error?.name !== "AbortError") {
          console.error("Erreur synchronisation panier:", error);
        }
      }
    };

    syncToServer();

    return () => {
      controller.abort();
    };
  }, [items, isAuthenticated, hasLoadedFromServer]);

  const addItem = (item: AddItemInput) => {
    const id = String(item.id);
    const price = normalizePrice(item.price);

    setItems((prev) => {
      const existing = prev.find((p) => p.id === id);
      if (existing) {
        return prev.map((p) =>
          p.id === id ? { ...p, quantity: p.quantity + 1 } : p
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

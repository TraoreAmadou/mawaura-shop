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
  price: number; // en euros / ou XOF selon ton usage UI
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

// ✅ LocalStorage key (panier invité)
const STORAGE_KEY = "mawaura_cart_v1";

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function sanitizeLocalCart(input: any): CartItem[] {
  if (!Array.isArray(input)) return [];

  const out: CartItem[] = [];
  for (const it of input) {
    if (!it || typeof it !== "object") continue;

    const id = typeof it.id === "string" ? it.id : null;
    const name = typeof it.name === "string" ? it.name : null;

    const price =
      typeof it.price === "number"
        ? it.price
        : typeof it.price === "string"
        ? Number(it.price)
        : NaN;

    const quantity =
      typeof it.quantity === "number"
        ? it.quantity
        : typeof it.quantity === "string"
        ? Number(it.quantity)
        : NaN;

    const slug = typeof it.slug === "string" ? it.slug : undefined;
    const imageUrl =
      it.imageUrl === null || typeof it.imageUrl === "string"
        ? it.imageUrl
        : null;

    if (!id || !name) continue;
    if (!Number.isFinite(price) || price < 0) continue;

    const q = Number.isFinite(quantity) ? Math.max(1, Math.floor(quantity)) : 1;

    out.push({
      id,
      name,
      price,
      quantity: q,
      slug,
      imageUrl,
    });
  }

  return out;
}

function readLocalCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  const parsed = safeParse<any>(localStorage.getItem(STORAGE_KEY));
  return sanitizeLocalCart(parsed);
}

function writeLocalCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore quota / private mode issues
  }
}

function clearLocalCart() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [lastAddedName, setLastAddedName] = useState<string | null>(null);
  const lastAddedTimeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated" && !!session?.user?.email;

  const [hasLoadedFromServer, setHasLoadedFromServer] = useState(false);
  const [hasLoadedFromLocal, setHasLoadedFromLocal] = useState(false);

  const normalizePrice = (price: number | string): number => {
    if (typeof price === "number") return price;

    const cleaned = String(price)
      .replace(/\s/g, "")
      .replace("€", "")
      .replace(",", ".");
    const parsed = parseFloat(cleaned);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  // ✅ 1) Au démarrage (et quand on n'est PAS connecté), on charge depuis localStorage
  useEffect(() => {
    if (isAuthenticated) return;

    const local = readLocalCart();
    setItems(local);
    setHasLoadedFromLocal(true);
    setHasLoadedFromServer(false);
  }, [isAuthenticated]);

  // ✅ 2) Persister le panier INVITÉ dans localStorage
  useEffect(() => {
    if (isAuthenticated) return;
    if (!hasLoadedFromLocal) return;

    writeLocalCart(items);
  }, [items, isAuthenticated, hasLoadedFromLocal]);

  // ✅ 3) Chargement du panier depuis le serveur à la connexion
  // + fusion avec le panier local (si l'utilisateur avait mis des items avant de se connecter)
  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    const loadFromServer = async () => {
      try {
        // panier local avant connexion
        const localBeforeLogin = readLocalCart();

        const res = await fetch("/api/cart", { cache: "no-store" });
        if (!res.ok) {
          console.error("Erreur chargement panier serveur");
          // si serveur KO, on garde au moins le local
          if (!cancelled) {
            setItems(localBeforeLogin);
          }
          return;
        }

        const data = (await res.json()) as ServerCartItem[];
        if (cancelled) return;

        const serverMapped: CartItem[] = data.map((it) => ({
          id: it.productId,
          name: it.name,
          price: it.priceCents / 100, // conversion en euros (ou adapte si tu changes côté UI)
          // price: it.priceCents, // si tu stockes déjà en XOF côté DB
          quantity: it.quantity,
          slug: it.slug,
          imageUrl: it.mainImageUrl ?? null,
        }));

        // ✅ Fusion server + local (quantités cumulées par id)
        const byId = new Map<string, CartItem>();
        for (const s of serverMapped) byId.set(s.id, { ...s });

        for (const l of localBeforeLogin) {
          const existing = byId.get(l.id);
          if (existing) {
            byId.set(l.id, {
              ...existing,
              quantity: existing.quantity + l.quantity,
            });
          } else {
            byId.set(l.id, { ...l });
          }
        }

        const merged = Array.from(byId.values());
        setItems(merged);

        // ✅ Une fois connecté, le localStorage n'est plus la source => on le vide
        clearLocalCart();
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

  // ✅ 4) Synchronisation du panier vers le serveur quand il change (connecté)
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
    // ✅ si invité => l'effet localStorage écrira []
    // ✅ si connecté => l'effet sync serveur enverra [] (comme avant)
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

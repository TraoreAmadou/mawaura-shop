"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useSession } from "next-auth/react";

type FavoriteItem = {
  id: string;
  slug: string;
  name: string;
  price: number;
  category?: string | null;
  imageUrl?: string | null;
};

type FavoritesContextType = {
  items: FavoriteItem[];
  toggleFavorite: (item: FavoriteItem) => void;
  isFavorite: (id: string) => boolean;
  removeFavorite: (id: string) => void;
  clearFavorites: () => void;
  totalFavorites: number;
};

type ServerFavoriteItem = {
  productId: string;
  slug: string;
  name: string;
  priceCents: number;
  category?: string | null;
  mainImageUrl?: string | null;
};

const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined
);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated" && !!session?.user?.email;
  const [hasLoadedFromServer, setHasLoadedFromServer] = useState(false);

  // 🔹 Chargement depuis le serveur
  useEffect(() => {
    if (!isAuthenticated) {
      setHasLoadedFromServer(false);
      return;
    }

    let cancelled = false;

    const loadFromServer = async () => {
      try {
        const res = await fetch("/api/favorites", { cache: "no-store" });
        if (!res.ok) {
          console.error("Erreur chargement favoris serveur");
          return;
        }

        const data = (await res.json()) as ServerFavoriteItem[];
        if (cancelled) return;

        const mapped: FavoriteItem[] = data.map((it) => ({
          id: it.productId,
          slug: it.slug,
          name: it.name,
          price: it.priceCents / 100, // conversion en euros
          // price: it.priceCents , // conversion en FCFA
          category: it.category ?? null,
          imageUrl: it.mainImageUrl ?? null,
        }));

        setItems(mapped);
      } catch (error) {
        console.error("Erreur chargement favoris serveur:", error);
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

  // 🔹 Synchronisation vers le serveur
  useEffect(() => {
    if (!isAuthenticated) return;
    if (!hasLoadedFromServer) return;

    const controller = new AbortController();

    const syncToServer = async () => {
      try {
        const payload = {
          productIds: items.map((item) => item.id),
        };

        await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      } catch (error: any) {
        if (error?.name !== "AbortError") {
          console.error("Erreur synchronisation favoris:", error);
        }
      }
    };

    syncToServer();

    return () => {
      controller.abort();
    };
  }, [items, isAuthenticated, hasLoadedFromServer]);

  const isFavorite = (id: string) => items.some((item) => item.id === id);

  const toggleFavorite = (item: FavoriteItem) => {
    setItems((prev) => {
      const exists = prev.some((p) => p.id === item.id);
      if (exists) {
        return prev.filter((p) => p.id !== item.id);
      }
      return [...prev, item];
    });
  };

  const removeFavorite = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearFavorites = () => setItems([]);

  const totalFavorites = useMemo(() => items.length, [items]);

  const value: FavoritesContextType = {
    items,
    toggleFavorite,
    isFavorite,
    removeFavorite,
    clearFavorites,
    totalFavorites,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error(
      "useFavorites doit être utilisé à l'intérieur de FavoritesProvider"
    );
  }
  return ctx;
}

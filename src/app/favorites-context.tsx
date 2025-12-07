"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  ReactNode,
} from "react";

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

const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined
);

const FAVORITES_STORAGE_KEY = "mawaura_favorites_v1";

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<FavoriteItem[]>([]);

  // 🔁 Chargement initial des favoris
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;

      const valid: FavoriteItem[] = parsed
        .filter((item: any) => item && typeof item.id === "string")
        .map((item: any) => ({
          id: String(item.id),
          slug: String(item.slug ?? ""),
          name: String(item.name ?? ""),
          price: typeof item.price === "number" ? item.price : 0,
          category: item.category ?? null,
          imageUrl:
            typeof item.imageUrl === "string" ? item.imageUrl : null,
        }));

      if (valid.length > 0) {
        setItems(valid);
      }
    } catch (error) {
      console.error(
        "Erreur lors du chargement des favoris depuis localStorage",
        error
      );
    }
  }, []);

  // 💾 Sauvegarde des favoris à chaque modification
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.setItem(
        FAVORITES_STORAGE_KEY,
        JSON.stringify(items)
      );
    } catch (error) {
      console.error(
        "Erreur lors de la sauvegarde des favoris dans localStorage",
        error
      );
    }
  }, [items]);

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

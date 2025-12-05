"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  ReactNode,
} from "react";

export type FavoriteItem = {
  id: string;               // ✅ string comme les ids Prisma
  name: string;
  price: number;            // ✅ number comme /api/products
  category?: string | null;
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

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<FavoriteItem[]>([]);

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

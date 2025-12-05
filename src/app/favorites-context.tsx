"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  ReactNode,
} from "react";

type FavoriteItem = {
  id: string;
  name: string;
  price: number;
  category?: string | null;
  imageUrl?: string | null;
};

type FavoritesContextType = {
  items: FavoriteItem[];
  toggleFavorite: (item: FavoriteItem) => void;
  isFavorite: (id: string | number) => boolean;
  removeFavorite: (id: string | number) => void;
  clearFavorites: () => void;
  totalFavorites: number;
};

const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined
);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<FavoriteItem[]>([]);

  const isFavorite = (id: string | number) => {
    const key = String(id);
    return items.some((item) => item.id === key);
  };

  const toggleFavorite = (item: FavoriteItem) => {
    const key = String(item.id);
    setItems((prev) => {
      const exists = prev.some((p) => p.id === key);
      if (exists) {
        return prev.filter((p) => p.id !== key);
      }
      return [...prev, { ...item, id: key }];
    });
  };

  const removeFavorite = (id: string | number) => {
    const key = String(id);
    setItems((prev) => prev.filter((item) => item.id !== key));
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

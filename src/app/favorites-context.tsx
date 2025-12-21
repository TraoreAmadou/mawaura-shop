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

// ✅ LocalStorage key (favoris invité)
const STORAGE_KEY = "mawaura_favorites_v1";

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function sanitizeLocalFavorites(input: any): FavoriteItem[] {
  if (!Array.isArray(input)) return [];

  const out: FavoriteItem[] = [];
  for (const it of input) {
    if (!it || typeof it !== "object") continue;

    const id = typeof it.id === "string" ? it.id : null;
    const slug = typeof it.slug === "string" ? it.slug : null;
    const name = typeof it.name === "string" ? it.name : null;

    const price =
      typeof it.price === "number"
        ? it.price
        : typeof it.price === "string"
        ? Number(it.price)
        : NaN;

    const category =
      it.category === null || typeof it.category === "string"
        ? it.category
        : null;

    const imageUrl =
      it.imageUrl === null || typeof it.imageUrl === "string"
        ? it.imageUrl
        : null;

    if (!id || !slug || !name) continue;
    if (!Number.isFinite(price) || price < 0) continue;

    out.push({
      id,
      slug,
      name,
      price,
      category,
      imageUrl,
    });
  }

  // dédoublonnage par id
  const byId = new Map<string, FavoriteItem>();
  for (const f of out) byId.set(f.id, f);
  return Array.from(byId.values());
}

function readLocalFavorites(): FavoriteItem[] {
  if (typeof window === "undefined") return [];
  const parsed = safeParse<any>(localStorage.getItem(STORAGE_KEY));
  return sanitizeLocalFavorites(parsed);
}

function writeLocalFavorites(items: FavoriteItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

function clearLocalFavorites() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated" && !!session?.user?.email;

  const [hasLoadedFromServer, setHasLoadedFromServer] = useState(false);
  const [hasLoadedFromLocal, setHasLoadedFromLocal] = useState(false);

  // ✅ 1) Au démarrage (et tant qu'on n'est PAS connecté), on charge depuis localStorage
  useEffect(() => {
    if (isAuthenticated) return;

    const local = readLocalFavorites();
    setItems(local);
    setHasLoadedFromLocal(true);
    setHasLoadedFromServer(false);
  }, [isAuthenticated]);

  // ✅ 2) Persister les favoris INVITÉ dans localStorage
  useEffect(() => {
    if (isAuthenticated) return;
    if (!hasLoadedFromLocal) return;

    writeLocalFavorites(items);
  }, [items, isAuthenticated, hasLoadedFromLocal]);

  // ✅ 3) Chargement depuis le serveur à la connexion + fusion avec local
  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    const loadFromServer = async () => {
      try {
        const localBeforeLogin = readLocalFavorites();

        const res = await fetch("/api/favorites", { cache: "no-store" });
        if (!res.ok) {
          console.error("Erreur chargement favoris serveur");
          // si serveur KO, on garde au moins le local
          if (!cancelled) setItems(localBeforeLogin);
          return;
        }

        const data = (await res.json()) as ServerFavoriteItem[];
        if (cancelled) return;

        const serverMapped: FavoriteItem[] = data.map((it) => ({
          id: it.productId,
          slug: it.slug,
          name: it.name,
          price: it.priceCents / 100, // conversion en euros
          // price: it.priceCents, // si tu utilises FCFA côté UI
          category: it.category ?? null,
          imageUrl: it.mainImageUrl ?? null,
        }));

        // ✅ Fusion server + local (union par id)
        const byId = new Map<string, FavoriteItem>();
        for (const s of serverMapped) byId.set(s.id, { ...s });
        for (const l of localBeforeLogin) {
          if (!byId.has(l.id)) byId.set(l.id, { ...l });
        }

        const merged = Array.from(byId.values());
        setItems(merged);

        // ✅ localStorage n'est plus la source une fois connecté
        clearLocalFavorites();
      } catch (error) {
        console.error("Erreur chargement favoris serveur:", error);
      } finally {
        if (!cancelled) setHasLoadedFromServer(true);
      }
    };

    loadFromServer();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  // ✅ 4) Synchronisation vers le serveur (connecté)
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

    return () => controller.abort();
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

  const clearFavorites = () => {
    setItems([]);
    // invité => l'effet localStorage écrira []
    // connecté => sync serveur enverra []
  };

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

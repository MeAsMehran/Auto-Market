import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { addFavorite, removeFavorite, getFavorites } from '../lib/carApi';
import { useAuth } from './AuthContext';

const FavoritesContext = createContext(null);

const STORAGE_KEY = 'likedCars';
const FAVORITES_PAGE_SIZE = 100;
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes — refreshes within this window skip the server fetch

// Module-level singleton so the favorites list is fetched at most once per
// session and is shared across every route in the app.
let globalData = null;

const emptyData = () => ({ ids: new Set(), cars: [], ts: 0 });

function readLocalCache() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Support both legacy format (bare array) and new format ({ cars, ts }).
    const cars = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.cars) ? parsed.cars : null);
    if (!cars) return null;
    const ts = Array.isArray(parsed) ? 0 : (parsed.ts || 0);
    return {
      ids: new Set(cars.map((c) => c.id).filter(Boolean)),
      cars,
      ts,
    };
  } catch {
    return null;
  }
}

function writeLocalCache(cars) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ cars, ts: Date.now() }));
  } catch {
    /* storage unavailable (private mode / quota) — ignore */
  }
}

async function fetchFromServer() {
  // Fetch every page so the "liked ids" set is complete for the whole app.
  let all = [];
  let page = 1;
  while (page <= 10) {
    const res = await getFavorites({ page, page_size: FAVORITES_PAGE_SIZE });
    const items = Array.isArray(res) ? res : res.results ?? [];
    all = all.concat(items);
    const next = Array.isArray(res) ? null : res.next;
    if (!next || items.length === 0 || all.length >= (res.count ?? Infinity)) break;
    page += 1;
  }

  const cars = all.map((f) => f.car ?? f).filter((c) => c && c.id);
  globalData = { ids: new Set(cars.map((c) => c.id)), cars, ts: Date.now() };
  writeLocalCache(cars);
  return globalData;
}

function updateSingleton(car, liked) {
  if (!globalData) return;
  const ids = new Set(globalData.ids);
  let cars = globalData.cars;
  if (liked) {
    ids.add(car.id);
    if (!cars.some((c) => c.id === car.id)) cars = [...cars, car];
  } else {
    ids.delete(car.id);
    cars = cars.filter((c) => c.id !== car.id);
  }
  globalData = { ids, cars, ts: Date.now() };
  writeLocalCache(cars);
}

export function clearFavoritesCache() {
  globalData = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function FavoritesProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const isAuthenticated = !!user;

  // Seed state instantly from the in-memory singleton or the localStorage
  // cache so hearts render before the network responds (stale-while-revalidate).
  const [state, setState] = useState(() =>
    globalData || readLocalCache() || emptyData()
  );
  const [loading, setLoading] = useState(() => !globalData && isAuthenticated);
  const sync = useCallback((data) => {
    const safe = data && data.ids ? data : emptyData();
    setState({ ...safe, ids: new Set(safe.ids) });
    setLoading(false);
  }, []);

  // Load / clear favorites whenever the auth state changes (login, logout,
  // first boot). Wait for auth to resolve first — clearing the cache while
  // auth is still loading would wipe a valid cache on every refresh.
  useEffect(() => {
    if (authLoading) return; // still checking the token — don't touch the cache yet

    if (!isAuthenticated) {
      clearFavoritesCache();
      globalData = emptyData();
      sync(globalData);
      return;
    }

    setLoading(true);
    const cached = readLocalCache();
    if (cached && !globalData) {
      globalData = cached;
      sync(cached); // hearts render immediately from cache
    }

    // Skip the server revalidation if the cache is fresh (within TTL).
    // Hearts are already showing from the cache, so there is no visual
    // change — we just avoid redundant network round-trips on rapid
    // refreshes. Cross-tab changes are still caught by the storage event.
    if (cached && cached.ts && Date.now() - cached.ts < CACHE_TTL) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    fetchFromServer()
      .then((data) => { if (!cancelled) sync(data); })
      .catch((err) => {
        console.error('Failed to load favorites:', err);
        if (!cancelled) sync(globalData || emptyData());
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authLoading]);

  // Cross-tab sync: when another tab likes/unlikes a car it writes to
  // localStorage; reflect that here without an extra network request.
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key !== STORAGE_KEY) return;
      const cache = readLocalCache();
      if (cache) {
        globalData = cache;
        sync(cache);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [sync]);

  const toggleLike = useCallback(
    async (car, e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      const token = localStorage.getItem('access_token');
      if (!token || !car?.id) return;

      const wasLiked = state.ids.has(car.id);
      const nextLiked = !wasLiked;

      // Make sure the singleton exists before the optimistic update.
      if (!globalData) globalData = emptyData();

      // Optimistic update across the whole app immediately.
      updateSingleton(car, nextLiked);
      sync(globalData);

      try {
        if (nextLiked) await addFavorite(car.id);
        else await removeFavorite(car.id);
      } catch {
        // Roll back on failure.
        updateSingleton(car, wasLiked);
        sync(globalData);
      }
    },
    [state.ids, sync]
  );

  const isLiked = useCallback((carId) => state.ids.has(carId), [state.ids]);

  const refresh = useCallback(async () => {
    const data = await fetchFromServer();
    sync(data);
    return data;
  }, [sync]);

  return (
    <FavoritesContext.Provider value={{ isLiked, toggleLike, loading, cars: state.cars, refresh }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used inside <FavoritesProvider>');
  return ctx;
}

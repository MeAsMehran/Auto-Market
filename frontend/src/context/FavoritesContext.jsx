import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { addFavorite, removeFavorite, getFavorites } from '../lib/carApi';

const FavoritesContext = createContext(null);

// Singleton per session — prevents duplicate fetch across hot reloads
let globalFavoritesData = null;
let globalFetchPromise = null;

async function fetchFavoritesOnce() {
  if (globalFavoritesData) return globalFavoritesData;
  if (globalFetchPromise) return globalFetchPromise;

  const token = localStorage.getItem('access_token');
  if (!token) {
    globalFavoritesData = { ids: new Set(), cars: [] };
    return globalFavoritesData;
  }

  globalFetchPromise = getFavorites()
    .then((favorites) => {
      const ids = new Set(favorites.map((f) => (typeof f === 'object' ? f.car?.id ?? f.id : f)));
      globalFavoritesData = { ids, cars: favorites };
      return globalFavoritesData;
    })
    .catch(() => {
      globalFavoritesData = { ids: new Set(), cars: [] };
      return globalFavoritesData;
    });

  return globalFetchPromise;
}

function updateGlobalSingleton(car, liked) {
  if (!globalFavoritesData) return;
  const newIds = new Set(globalFavoritesData.ids);
  if (liked) newIds.add(car.id);
  else newIds.delete(car.id);
  globalFavoritesData = { ...globalFavoritesData, ids: newIds };
}

function syncLocalStorage(car, liked) {
  const stored = JSON.parse(localStorage.getItem('likedCars') || '[]');
  if (liked) {
    if (!stored.find((c) => c.id === car.id)) stored.push(car);
  } else {
    const idx = stored.findIndex((c) => c.id === car.id);
    if (idx !== -1) stored.splice(idx, 1);
  }
  localStorage.setItem('likedCars', JSON.stringify(stored));
}

export function FavoritesProvider({ children }) {
  const [favoritesData, setFavoritesData] = useState(globalFavoritesData || { ids: new Set(), cars: [] });
  const [loading, setLoading] = useState(!globalFavoritesData);

  useEffect(() => {
    // Always start from global singleton in case it was already fetched
    setFavoritesData(globalFavoritesData || { ids: new Set(), cars: [] });
    setLoading(!globalFavoritesData);

    fetchFavoritesOnce().then((data) => {
      setFavoritesData({ ...data, ids: new Set(data.ids) });
      setLoading(false);
    });

    // Re-fetch when tab regains focus (e.g. after removing a like on another page)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        globalFavoritesData = null; // force re-fetch from server
        globalFetchPromise = null;
        fetchFavoritesOnce().then((data) => {
          setFavoritesData({ ...data, ids: new Set(data.ids) });
          setLoading(false);
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const toggleLike = useCallback(async (car, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const token = localStorage.getItem('access_token');
    if (!token) return;

    const isCurrentlyLiked = favoritesData.ids.has(car.id);
    const newLiked = !isCurrentlyLiked;

    // Optimistic update
    setFavoritesData((prev) => {
      const newIds = new Set(prev.ids);
      if (newLiked) newIds.add(car.id);
      else newIds.delete(car.id);
      syncLocalStorage(car, newLiked);
      updateGlobalSingleton(car, newLiked); // keep singleton in sync
      return { ...prev, ids: newIds };
    });

    try {
      if (newLiked) {
        await addFavorite(car.id);
      } else {
        await removeFavorite(car.id);
      }
    } catch {
      // Revert on failure
      setFavoritesData((prev) => {
        const newIds = new Set(prev.ids);
        if (newLiked) newIds.delete(car.id);
        else newIds.add(car.id);
        syncLocalStorage(car, !newLiked);
        updateGlobalSingleton(car, !newLiked); // keep singleton in sync
        return { ...prev, ids: newIds };
      });
    }
  }, [favoritesData.ids]);

  const isLiked = useCallback(
    (carId) => favoritesData.ids.has(carId),
    [favoritesData.ids],
  );

  return (
    <FavoritesContext.Provider value={{ isLiked, toggleLike, loading, cars: favoritesData.cars }}>
      {children}
    </FavoritesContext.Provider>
  );
}

// Exported so other components (e.g. LikedAds) can sync the singleton
// without needing to re-fetch the whole list.
export { updateGlobalSingleton };

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used inside <FavoritesProvider>');
  return ctx;
}

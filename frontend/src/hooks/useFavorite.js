import { useState, useEffect, useCallback } from 'react';
import { addFavorite, removeFavorite, getFavorites } from '../lib/carApi';

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

export default function useFavorite(car) {
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const token = localStorage.getItem('access_token');
      if (!token || !car?.id) return;
      try {
        const favorites = await getFavorites();
        if (cancelled) return;
        const ids = favorites.map((f) => f.car?.id ?? f.car);
        setLiked(ids.includes(car.id));
      } catch {
        // silent
      }
    };
    check();
    return () => { cancelled = true; };
  }, [car?.id]);

  const toggleLike = useCallback(
    async (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (loading) return;

      const token = localStorage.getItem('access_token');
      if (!token) return;

      const newLiked = !liked;
      setLiked(newLiked);
      syncLocalStorage(car, newLiked);

      setLoading(true);
      try {
        if (newLiked) {
          await addFavorite(car.id);
        } else {
          await removeFavorite(car.id);
        }
      } catch {
        setLiked(!newLiked);
        syncLocalStorage(car, !newLiked);
      } finally {
        setLoading(false);
      }
    },
    [car, liked, loading],
  );

  return { liked, loading, toggleLike };
}

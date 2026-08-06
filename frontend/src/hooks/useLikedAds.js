import { useState, useEffect, useCallback, useRef } from 'react';
import { getFavorites } from '../lib/carApi';

const PAGE_SIZE = 20;

export function useLikedAds(page = 1) {
  const [data, setData] = useState({
    cars: [],
    count: 0,
    next: null,
    previous: null,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Guards against StrictMode double-invoking the mount effect (which would
  // otherwise fire two identical `page_size=20` requests on every refresh),
  // and against a stale response from a previous page overwriting newer state.
  const inFlightRef = useRef(new Set());
  const latestKeyRef = useRef('');

  const fetchPage = useCallback(async (pageNum, { force = false } = {}) => {
    const key = `liked-${pageNum}`;

    // `force` bypasses the in-flight guard so an explicit `refetch()` (e.g.
    // after un-liking a car) always refreshes the list.
    if (!force && inFlightRef.current.has(key)) return;
    inFlightRef.current.add(key);
    latestKeyRef.current = key;

    setLoading(true);
    setError(null);
    try {
      const res = await getFavorites({ page: pageNum, page_size: PAGE_SIZE });
      if (latestKeyRef.current !== key) return; // superseded by a newer request
      const results = res.results ?? [];
      const cars = results.map((f) => f.car ?? f).filter((c) => c && c.id);
      const totalPages = Math.ceil((res.count ?? 0) / PAGE_SIZE);
      setData({
        cars,
        count: res.count ?? 0,
        next: res.next,
        previous: res.previous,
        totalPages,
      });
    } catch (err) {
      if (latestKeyRef.current !== key) return;
      console.error('Failed to load liked ads:', err);
      setError('خطا در دریافت آگهی‌های مورد علاقه. لطفاً دوباره تلاش کنید.');
    } finally {
      inFlightRef.current.delete(key);
      if (latestKeyRef.current === key) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPage(page);
  }, [page, fetchPage]);

  const refetch = useCallback(
    () => fetchPage(page, { force: true }),
    [page, fetchPage]
  );

  return { ...data, loading, error, refetch, pageSize: PAGE_SIZE };
}
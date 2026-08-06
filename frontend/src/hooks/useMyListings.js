import { useState, useEffect, useCallback, useRef } from 'react';
import { getMyListings } from '../lib/carApi';

const PAGE_SIZE = 10;

export function useMyListings(page = 1, { search = '', status } = {}) {
  const [data, setData] = useState({ cars: [], count: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Guards against StrictMode double-invoking the mount effect (which would
  // otherwise fire two identical requests on every refresh), and against a
  // stale response from a previous page/request overwriting newer state.
  const inFlightRef = useRef(new Set());
  const latestKeyRef = useRef('');

  const fetchPage = useCallback(async (pageNum, { force = false } = {}) => {
    const params = { page: pageNum, page_size: PAGE_SIZE };
    if (search) params.search = search;
    if (status) params.status = status;
    const key = JSON.stringify(params);

    // `force` bypasses the in-flight guard so an explicit `refetch()` (e.g.
    // after delete/restore) always refreshes the list.
    if (!force && inFlightRef.current.has(key)) return;
    inFlightRef.current.add(key);
    latestKeyRef.current = key;

    setLoading(true);
    setError(null);
    try {
      const res = await getMyListings(params);
      if (latestKeyRef.current !== key) return; // superseded by a newer request
      const results = res.results ?? [];
      const totalPages = Math.ceil((res.count ?? 0) / PAGE_SIZE);
      setData({ cars: results, count: res.count ?? 0, totalPages });
    } catch {
      if (latestKeyRef.current !== key) return;
      setError('خطا در دریافت آگهی‌ها.');
    } finally {
      inFlightRef.current.delete(key);
      if (latestKeyRef.current === key) setLoading(false);
    }
  }, [search, status]);

  useEffect(() => { fetchPage(page); }, [page, fetchPage]);

  const refetch = useCallback(() => fetchPage(page, { force: true }), [page, fetchPage]);

  return { ...data, loading, error, refetch, pageSize: PAGE_SIZE };
}
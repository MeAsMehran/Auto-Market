import { useState, useEffect, useCallback } from 'react';
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

  const fetchPage = useCallback(async (pageNum) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getFavorites({ page: pageNum, page_size: PAGE_SIZE });
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
      console.error('Failed to load liked ads:', err);
      setError('خطا در دریافت آگهی‌های مورد علاقه. لطفاً دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPage(page);
  }, [page, fetchPage]);

  const refetch = useCallback(() => fetchPage(page), [page, fetchPage]);

  return { ...data, loading, error, refetch, pageSize: PAGE_SIZE };
}

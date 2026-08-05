import { useState, useEffect, useCallback } from 'react';
import { getMyListings } from '../lib/carApi';

const PAGE_SIZE = 10;

export function useMyListings(page = 1, { search = '', status } = {}) {
  const [data, setData] = useState({ cars: [], count: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPage = useCallback(async (pageNum) => {
    setLoading(true);
    setError(null);
    try {
      const params = { page: pageNum, page_size: PAGE_SIZE };
      if (search) params.search = search;
      if (status) params.status = status;

      const res = await getMyListings(params);
      const results = res.results ?? [];
      const totalPages = Math.ceil((res.count ?? 0) / PAGE_SIZE);
      setData({ cars: results, count: res.count ?? 0, totalPages });
    } catch {
      setError('خطا در دریافت آگهی‌ها.');
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => { fetchPage(page); }, [page, fetchPage]);

  const refetch = useCallback(() => fetchPage(page), [page, fetchPage]);

  return { ...data, loading, error, refetch, pageSize: PAGE_SIZE };
}

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { useAuth } from './AuthContext';

const StatsContext = createContext(null);

export function StatsProvider({ children }) {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    ads: 0,
    messages: 0,
    likes: 0,
    totalViews: 0,
    latestAds: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fetched, setFetched] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!user) return;
    if (fetched && !isFetching) return;
    if (isFetching) return;
    setIsFetching(true);
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/dashboard/');
      setStats({
        ads: response.data.active_ads_number || 0,
        messages: response.data.unread_messages || 0,
        likes: response.data.liked_ads_number || 0,
        totalViews: response.data.total_views || 0,
        latestAds: response.data.latest_ads || [],
      });
      setFetched(true);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      setError('خطا در بارگذاری آمار');
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  }, [user, fetched, isFetching]);

  const refreshStats = useCallback(() => {
    setFetched(false);
  }, []);

  useEffect(() => {
    if (fetched === false && user) {
      fetchStats();
    }
  }, [fetched, user, fetchStats]);

  useEffect(() => {
    if (!user) {
      setStats({ ads: 0, messages: 0, likes: 0, totalViews: 0, latestAds: [] });
      setFetched(false);
      setIsFetching(false);
    } else {
      setFetched(false);
    }
  }, [user]);

  const updateLikes = useCallback((delta) => {
    setStats((prev) => ({ ...prev, likes: Math.max(0, prev.likes + delta) }));
  }, []);

  return (
    <StatsContext.Provider value={{ stats, loading, error, fetchStats, refreshStats, updateLikes }}>
      {children}
    </StatsContext.Provider>
  );
}

export function useStats() {
  const context = useContext(StatsContext);
  if (!context) {
    throw new Error('useStats must be used within StatsProvider');
  }
  return context;
}

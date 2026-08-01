import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { setAuthToken } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState(null); // In-memory only

  // Initialize auth on app load
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('access_token');
      if (storedToken) {
        setAccessToken(storedToken);
        setAuthToken(storedToken);
        try {
          const res = await api.get('/auth/accounts/me/');
          setUser(res.data);
        } catch (err) {
          // Token expired, try refresh
          try {
            const refreshRes = await api.post('/auth/accounts/refresh/');
            const newToken = refreshRes.data.access;
            setAccessToken(newToken);
            setAuthToken(newToken);
            const meRes = await api.get('/auth/accounts/me/');
            setUser(meRes.data);
          } catch (refreshErr) {
            logout();
          }
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = useCallback(async (phone, password) => {
    const { data } = await api.post('/auth/accounts/login/', { phone, password });
    // data.access is in response body, refresh token is in httpOnly cookie
    setAccessToken(data.access);
    setAuthToken(data.access);
    const me = await api.get('/auth/accounts/me/');
    setUser(me.data);
    return data;
  }, []);

  const register = useCallback(async (data) => {
    const res = await api.post('/auth/accounts/register/', data);
    return res.data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/accounts/logout/');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setAccessToken(null);
      setAuthToken(null);
      setUser(null);
      sessionStorage.removeItem('postAdDraft');
      sessionStorage.removeItem('myListings');
    }
  }, []);

  const updateUser = useCallback((userData) => {
    setUser(userData);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      accessToken,
      login,
      register,
      logout,
      updateUser,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

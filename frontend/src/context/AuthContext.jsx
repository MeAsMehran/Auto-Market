import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { setAuthToken, onAuthError } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState(null); // In-memory only

  // Initialize auth on app load
  useEffect(() => {
    let cancelled = false;

    const initAuth = async () => {
      const storedToken = localStorage.getItem('access_token');
      if (storedToken) {
        if (!cancelled) {
          setAccessToken(storedToken);
          setAuthToken(storedToken);
        }
        try {
          const res = await api.get('/auth/accounts/me/');
          if (!cancelled) setUser(res.data);
        } catch (err) {
          // Interceptor already attempted refresh and failed; clean up
          if (!cancelled) {
            await logout();
          }
        }
      }
      if (!cancelled) setLoading(false);
    };

    initAuth();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Wire up the global auth error handler from api.js
  useEffect(() => {
    onAuthError(() => {
      logout();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      navigate('/login', { replace: true });
    }
  }, [navigate]);

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

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { setAuthToken, onAuthError } from '../lib/api';
import { clearFavoritesCache } from '../context/FavoritesContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState(null); // In-memory only

  // Initialize auth on app load
  const initPromiseRef = useRef(null);

  useEffect(() => {
    if (!initPromiseRef.current) {
      initPromiseRef.current = (async () => {
        const storedToken = localStorage.getItem('access_token');
        if (storedToken) {
          setAccessToken(storedToken);
          setAuthToken(storedToken);
          try {
            const res = await api.get('/auth/accounts/me/');
            setUser(res.data);
          } catch {
            // The interceptor already attempted a token refresh and failed, so
            // just clear local state here (no extra logout request needed).
            clearFavoritesCache();
            setAccessToken(null);
            setAuthToken(null);
            setUser(null);
          }
        }
        setLoading(false);
      })();
    }
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
      clearFavoritesCache();
      sessionStorage.removeItem('postAdDraft');
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

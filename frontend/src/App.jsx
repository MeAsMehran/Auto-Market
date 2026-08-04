import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { FavoritesProvider } from './context/FavoritesContext';
import ScrollToTop from './components/ScrollToTop';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AnimatedPage from './components/AnimatedPage';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CarDetail from './pages/CarDetail';
import PostAd from './pages/PostAd';
import Dashboard from './pages/Dashboard';
import MyListings from './pages/MyListings';
import EditAd from './pages/EditAd';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import LikedAds from './pages/LikedAds';

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <FavoritesProvider>
          <Routes>
            <Route path="/login" element={<AnimatedPage><Login /></AnimatedPage>} />
            <Route path="/register" element={<AnimatedPage><Register /></AnimatedPage>} />
            <Route element={<Layout />}>
              <Route path="/" element={<AnimatedPage><Home /></AnimatedPage>} />
              <Route path="/car/:id" element={<AnimatedPage><CarDetail /></AnimatedPage>} />
              <Route
                path="/liked-ads"
                element={<ProtectedRoute><AnimatedPage><LikedAds /></AnimatedPage></ProtectedRoute>}
              />
              <Route
                path="/post-ad"
                element={<ProtectedRoute><AnimatedPage><PostAd /></AnimatedPage></ProtectedRoute>}
              />
              <Route
                path="/dashboard"
                element={<ProtectedRoute><AnimatedPage><Dashboard /></AnimatedPage></ProtectedRoute>}
              />
              <Route
                path="/settings"
                element={<ProtectedRoute><AnimatedPage><Settings /></AnimatedPage></ProtectedRoute>}
              />
              <Route
                path="/my-listings"
                element={<ProtectedRoute><AnimatedPage><MyListings /></AnimatedPage></ProtectedRoute>}
              />
              <Route
                path="/my-listings/:id/edit"
                element={<ProtectedRoute><AnimatedPage><EditAd /></AnimatedPage></ProtectedRoute>}
              />
              <Route
                path="/chat"
                element={<ProtectedRoute><AnimatedPage><Chat /></AnimatedPage></ProtectedRoute>}
              />
            </Route>
          </Routes>
        </FavoritesProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

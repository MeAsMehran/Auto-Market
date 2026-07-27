import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
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
import Chat from './pages/Chat';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<AnimatedPage><Login /></AnimatedPage>} />
          <Route path="/register" element={<AnimatedPage><Register /></AnimatedPage>} />
          <Route element={<Layout />}>
            <Route path="/" element={<AnimatedPage><Home /></AnimatedPage>} />
            <Route path="/car/:id" element={<AnimatedPage><CarDetail /></AnimatedPage>} />
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
              path="/chat"
              element={<ProtectedRoute><AnimatedPage><Chat /></AnimatedPage></ProtectedRoute>}
            />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

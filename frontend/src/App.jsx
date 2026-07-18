import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CarDetail from './pages/CarDetail';
import PostAd from './pages/PostAd';
import Dashboard from './pages/Dashboard';
import MyListings from './pages/MyListings';
import Chat from './pages/Chat';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/car/:id" element={<CarDetail />} />
            <Route path="/post-ad" element={<PostAd />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/my-listings" element={<MyListings />} />
            <Route path="/chat" element={<Chat />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

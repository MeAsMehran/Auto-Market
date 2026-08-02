import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, Plus, MessageCircle, ChevronDown, Menu, X, Car, LogOut, User, ClipboardList, Sun, Moon, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const cities = ['تهران', 'مشهد', 'کرج', 'اصفهان', 'شیراز', 'تبریز', 'اهواز', 'قم', 'کرمانشاه', 'رشت'];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [city, setCity] = useState('تهران');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/?search=${searchQuery}`);
  };

  return (
    <header className="sticky top-0 z-50 bg-surface border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <Car className="w-7 h-7 text-brand-500" />
              <span className="text-xl font-bold text-brand-700 hidden sm:block">آتو مارکت</span>
            </Link>

            <div className="relative">
              <button
                onClick={() => setShowCityDropdown(!showCityDropdown)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-surface-tertiary rounded-lg transition-colors"
              >
                <span className="hidden lg:inline">{city}</span>
                <span className="lg:hidden">شهر</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {showCityDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowCityDropdown(false)} />
                  <div className="absolute top-full mt-1 left-0 w-48 bg-surface rounded-xl shadow-lg border border-border py-2 z-20 max-h-72 overflow-y-auto">
                    {cities.map((c) => (
                      <button
                        key={c}
                        onClick={() => { setCity(c); setShowCityDropdown(false); }}
                        className={`w-full text-right px-4 py-2 text-sm hover:bg-surface-tertiary transition-colors ${city === c ? 'text-brand-500 font-medium' : 'text-text-secondary'}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <form onSubmit={handleSearch} className="flex-1 max-w-lg hidden md:block">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                type="text"
                placeholder="جستجوی خودرو، برند، مدل..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2 bg-surface-tertiary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
              />
            </div>
          </form>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 text-text-secondary hover:bg-surface-tertiary rounded-xl transition-colors"
              title={theme === 'dark' ? 'حالت روشن' : 'حالت تاریک'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {user ? (
              <>
                <Link to="/chat" className="p-2 text-text-secondary hover:bg-surface-tertiary rounded-xl transition-colors relative">
                  <MessageCircle className="w-5 h-5" />
                  <span className="absolute -top-0.5 -left-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">۳</span>
                </Link>
                <button className="p-2 text-text-secondary hover:bg-surface-tertiary rounded-xl transition-colors">
                  <Bell className="w-5 h-5" />
                </button>

                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-surface-tertiary rounded-xl transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-brand-500 text-white flex items-center justify-center text-xs font-bold">
                      {user.name?.[0] || 'U'}
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {showUserMenu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                      <div className="absolute top-full mt-1 left-0 w-56 bg-surface rounded-xl shadow-lg border border-border py-2 z-20">
                        <div className="px-4 py-2 border-b border-border">
                          <p className="text-sm font-medium text-text-primary">{user.name || 'کاربر'}</p>
                          <p className="text-xs text-text-tertiary">{user.phone}</p>
                        </div>
                        <Link to="/dashboard" onClick={() => setShowUserMenu(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-tertiary transition-colors">
                          <User className="w-4 h-4" /> پیشخوان
                        </Link>
                        <Link to="/my-listings" onClick={() => setShowUserMenu(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-tertiary transition-colors">
                          <ClipboardList className="w-4 h-4" /> آگهی‌های من
                        </Link>
                        <Link to="/liked-ads" onClick={() => setShowUserMenu(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-tertiary transition-colors">
                          <Heart className="w-4 h-4" /> خودروهای مورد علاقه
                        </Link>
                        <button onClick={() => { logout(); setShowUserMenu(false); navigate('/'); }} className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors w-full">
                          <LogOut className="w-4 h-4" /> خروج
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <Link
                  to="/post-ad"
                  className="hidden sm:flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>فروش</span>
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-tertiary rounded-xl transition-colors">
                  ورود
                </Link>
                <Link to="/register" className="px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-xl transition-colors">
                  ثبت‌نام
                </Link>
              </>
            )}

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-text-secondary hover:bg-surface-tertiary rounded-xl transition-colors">
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-surface px-4 py-4 space-y-3">
          <form onSubmit={(e) => { handleSearch(e); setMobileMenuOpen(false); }}>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                type="text"
                placeholder="جستجوی خودرو..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2.5 bg-surface-tertiary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </form>
          {!user && (
            <div className="flex gap-2">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="flex-1 text-center px-4 py-2.5 text-sm font-medium text-text-secondary border border-border rounded-xl hover:bg-surface-tertiary">ورود</Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="flex-1 text-center px-4 py-2.5 text-sm font-medium bg-brand-500 text-white rounded-xl hover:bg-brand-600">ثبت‌نام</Link>
            </div>
          )}
          {user && (
            <Link to="/post-ad" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center gap-2 w-full bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold">
              <Plus className="w-4 h-4" /> ثبت آگهی
            </Link>
          )}
        </div>
      )}
    </header>
  );
}

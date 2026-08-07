import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, Plus, MessageCircle, ChevronDown, Menu, X, Car, LogOut, User, ClipboardList, Sun, Moon, Heart, Settings, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useStats } from '../context/StatsContext';
import { toPersianNumber } from '../utils/format';

const cities = ['تهران', 'مشهد', 'کرج', 'اصفهان', 'شیراز', 'تبریز', 'اهواز', 'قم', 'کرمانشاه', 'رشت'];

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { stats, fetchStats } = useStats();
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

  useEffect(() => {
    if (user) fetchStats();
  }, [user, fetchStats]);

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
                className="w-full pr-10 pl-10 py-2 bg-surface-tertiary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    navigate('/');
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
                >
                  ✕
                </button>
              )}
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

            {loading ? (
              <div className="w-32 h-8" />
            ) : user ? (
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
                    className="flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-text-secondary hover:bg-surface-tertiary rounded-xl transition-colors group"
                  >
                    <motion.div
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.94 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                      className="relative w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center text-sm font-bold shadow-sm ring-2 ring-surface"
                    >
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-full" />
                      ) : (
                        user.name?.[0] || 'U'
                      )}
                    </motion.div>
                    <motion.div
                      animate={{ rotate: showUserMenu ? 180 : 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="hidden sm:block"
                    >
                      <ChevronDown className="w-4 h-4 text-text-tertiary group-hover:text-text-secondary" />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {showUserMenu && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.96 }}
                          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                          style={{ transformOrigin: 'top left' }}
                          className="absolute top-full mt-2 left-0 w-72 bg-surface rounded-2xl shadow-xl border border-border overflow-hidden z-20 will-change-transform"
                        >
                          {/* Gradient header banner */}
                          <div className="relative h-20 bg-gradient-to-br from-brand-600 via-brand-500 to-brand-400 overflow-hidden">
                            <motion.div
                              className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"
                              animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
                              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                            />
                            <div className="absolute top-2.5 right-3 flex items-center gap-1 px-2 py-0.5 bg-white/15 backdrop-blur-sm rounded-full text-white text-[10px] font-medium">
                              <Sparkles className="w-2.5 h-2.5" /> کاربر ویژه
                            </div>
                          </div>

                          {/* Avatar + name overlapping the banner */}
                          <div className="px-4 pb-3 -mt-10 text-center">
                            <motion.div
                              initial={{ scale: 0.7, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ duration: 0.35, delay: 0.08, ease: 'easeOut' }}
                              className="relative inline-block"
                            >
                              <div className="w-20 h-20 rounded-full bg-surface p-1 shadow-lg">
                                <div className="w-full h-full rounded-full bg-gradient-to-br from-brand-100 to-brand-300 dark:from-brand-900 dark:to-brand-700 flex items-center justify-center overflow-hidden">
                                  {user?.avatar ? (
                                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-2xl font-bold text-brand-600 dark:text-brand-300">
                                      {user.name?.[0] || 'U'}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <motion.div
                                className="absolute inset-0 rounded-full border-2 border-brand-400/40"
                                animate={{ scale: [1, 1.18, 1], opacity: [0.6, 0, 0.6] }}
                                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut' }}
                              />
                            </motion.div>

                            <p className="font-bold text-text-primary mt-2">{user.name || 'کاربر'}</p>
                            <p className="text-xs text-text-tertiary">{user.phone || ''}</p>

                            {/* Mini stats row */}
                            <div className="grid grid-cols-3 gap-2 mt-3">
                              <div className="bg-surface-secondary rounded-lg py-1.5">
                                <p className="text-xs font-bold text-brand-500">{toPersianNumber(stats.ads)}</p>
                                <p className="text-[10px] text-text-tertiary">آگهی</p>
                              </div>
                              <div className="bg-surface-secondary rounded-lg py-1.5">
                                <p className="text-xs font-bold text-accent-500">{toPersianNumber(stats.messages)}</p>
                                <p className="text-[10px] text-text-tertiary">پیام</p>
                              </div>
                              <div className="bg-surface-secondary rounded-lg py-1.5">
                                <p className="text-xs font-bold text-red-500">{toPersianNumber(stats.likes)}</p>
                                <p className="text-[10px] text-text-tertiary">علاقه</p>
                              </div>
                            </div>
                          </div>

                          {/* Nav links */}
                          <div className="border-t border-border py-2">
                            {[
                              { label: 'پیشخوان', icon: User, href: '/dashboard' },
                              { label: 'آگهی‌های من', icon: ClipboardList, href: '/my-listings' },
                              { label: 'خودروهای مورد علاقه', icon: Heart, href: '/liked-ads' },
                              { label: 'تنظیمات', icon: Settings, href: '/settings' },
                            ].map((item, i) => (
                              <motion.div
                                key={item.href}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 + i * 0.04, duration: 0.25, ease: 'easeOut' }}
                              >
                                <Link
                                  to={item.href}
                                  onClick={() => setShowUserMenu(false)}
                                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-tertiary hover:text-brand-500 transition-colors"
                                >
                                  <item.icon className="w-4 h-4" /> {item.label}
                                </Link>
                              </motion.div>
                            ))}
                          </div>

                          {/* Logout */}
                          <div className="border-t border-border p-2">
                            <motion.button
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.28, duration: 0.25, ease: 'easeOut' }}
                              onClick={() => { logout(); setShowUserMenu(false); navigate('/'); }}
                              whileTap={{ scale: 0.97 }}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded-xl transition-colors w-full"
                            >
                              <LogOut className="w-4 h-4" /> خروج از حساب
                            </motion.button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
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
                className="w-full pr-10 pl-10 py-2.5 bg-surface-tertiary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    navigate('/');
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
                >
                  ✕
                </button>
              )}
            </div>
          </form>
          {loading ? null : !user && (
            <div className="flex gap-2">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="flex-1 text-center px-4 py-2.5 text-sm font-medium text-text-secondary border border-border rounded-xl hover:bg-surface-tertiary">ورود</Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="flex-1 text-center px-4 py-2.5 text-sm font-medium bg-brand-500 text-white rounded-xl hover:bg-brand-600">ثبت‌نام</Link>
            </div>
          )}
          {loading ? null : user && (
            <Link to="/post-ad" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center gap-2 w-full bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold">
              <Plus className="w-4 h-4" /> ثبت آگهی
            </Link>
          )}
        </div>
      )}
    </header>
  );
}

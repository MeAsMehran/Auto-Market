import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Car, MessageCircle, Heart, Settings, Clock, Eye, TrendingUp, Plus, Edit2, LogOut, CheckCircle, Activity, Sparkles, ChevronLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { staggerContainer, fadeUpItem } from '../components/AnimatedPage';

const MOCK_STATS = [
  { label: 'آگهی‌های فعال', value: 5, icon: Car, color: 'text-brand-500', bg: 'bg-brand-50 dark:bg-brand-950', ring: 'ring-brand-500/20' },
  { label: 'تعداد بازدید', value: 1247, icon: Eye, color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950', ring: 'ring-blue-500/20' },
  { label: 'پیام‌ها', value: 12, icon: MessageCircle, color: 'text-accent-500 dark:text-accent-400', bg: 'bg-accent-50 dark:bg-accent-950', ring: 'ring-accent-500/20' },
  { label: 'جستجوهای ذخیره شده', value: 3, icon: Heart, color: 'text-red-500 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950', ring: 'ring-red-500/20' },
];

const MOCK_LISTINGS = [
  { id: 1, title: '۲۰۲۲ تسلا مدل ۳ لانگ رنج', price: '$۴۵,۰۰۰', views: 342, status: 'active', date: '۲ روز پیش', image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=200&h=150&fit=crop' },
  { id: 2, title: '۲۰۲۱ بامو X5 xDrive40i', price: '$۳۸,۵۰۰', views: 156, status: 'active', date: '۱ هفته پیش', image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=200&h=150&fit=crop' },
  { id: 3, title: '۲۰۲۰ مرسدس بنز C300', price: '$۳۲,۰۰۰', views: 89, status: 'pending', date: '۲ هفته پیش', image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=200&h=150&fit=crop' },
];

const navItems = [
  { label: 'پیشخوان', icon: User, href: '/dashboard', active: true },
  { label: 'آگهی‌های من', icon: Car, href: '/my-listings', active: false },
  { label: 'پیام‌ها', icon: MessageCircle, href: '/chat', active: false },
  { label: 'علاقه‌مندی‌ها', icon: Heart, href: '/liked-ads', active: false },
  { label: 'تنظیمات', icon: Settings, href: '/settings', active: false },
];

const sideVariants = {
  hidden: { opacity: 0, x: -24 },
  show: (i) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.45, delay: 0.05 * i, ease: 'easeOut' },
  }),
};

function AnimatedStat({ stat, index }) {
  return (
    <motion.div
      variants={fadeUpItem}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`bg-surface rounded-2xl border border-border p-5 ring-1 ${stat.ring} will-change-transform`}
    >
      <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
        <stat.icon className={`w-6 h-6 ${stat.color}`} />
      </div>
      <p className="text-2xl font-bold text-text-primary">{stat.value.toLocaleString('fa-IR')}</p>
      <p className="text-sm text-text-tertiary">{stat.label}</p>
    </motion.div>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* ── Profile Sidebar ── */}
        <div className="lg:w-72 shrink-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="bg-surface rounded-2xl border border-border overflow-hidden sticky top-20 shadow-sm"
          >
            {/* Gradient cover banner */}
            <div className="relative h-28 bg-gradient-to-br from-brand-600 via-brand-500 to-brand-400 overflow-hidden">
              <motion.div
                className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/10 rounded-full blur-xl"
                animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
              />
              <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 bg-white/15 backdrop-blur-sm rounded-full text-white text-[10px] font-medium">
                <Sparkles className="w-3 h-3" />
                کاربر ویژه
              </div>
            </div>

            {/* Avatar */}
            <div className="px-6 pb-6 -mt-12 text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
                className="relative inline-block"
              >
                <div className="w-24 h-24 rounded-full bg-surface p-1.5 shadow-lg">
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-full h-full rounded-full bg-gradient-to-br from-brand-100 to-brand-300 dark:from-brand-900 dark:to-brand-700 flex items-center justify-center overflow-hidden"
                  >
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl font-bold text-brand-600 dark:text-brand-300">
                        {(user?.name || 'ک')[0]}
                      </span>
                    )}
                  </motion.div>
                </div>
                {/* Animated ring around avatar */}
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-brand-400/40"
                  animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut' }}
                />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 }}
                className="font-bold text-text-primary text-lg mt-3"
              >
                {user?.name || 'کاربر'}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.32 }}
                className="text-sm text-text-tertiary"
              >
                {user?.phone || '+۹۸ ۹۱۲ ۳۴۵ ۶۷۸۹'}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="grid grid-cols-3 gap-2 mt-4 mb-4"
              >
                <div className="bg-surface-secondary rounded-xl py-2 px-1">
                  <p className="text-sm font-bold text-brand-500">۵</p>
                  <p className="text-[10px] text-text-tertiary">آگهی</p>
                </div>
                <div className="bg-surface-secondary rounded-xl py-2 px-1">
                  <p className="text-sm font-bold text-accent-500">۱۲</p>
                  <p className="text-[10px] text-text-tertiary">پیام</p>
                </div>
                <div className="bg-surface-secondary rounded-xl py-2 px-1">
                  <p className="text-sm font-bold text-red-500">۳</p>
                  <p className="text-[10px] text-text-tertiary">علاقه</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.48 }}
              >
                <Link
                  to="/post-ad"
                  className="inline-flex items-center gap-2 w-full justify-center px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-md shadow-brand-500/20"
                >
                  <Plus className="w-4 h-4" /> آگهی جدید
                </Link>
              </motion.div>
            </div>

            {/* Nav */}
            <nav className="px-3 pb-4 space-y-1 border-t border-border pt-3">
              {navItems.map((item, i) => (
                <motion.div
                  key={item.label}
                  custom={i}
                  variants={sideVariants}
                  initial="hidden"
                  animate="show"
                >
                  <Link
                    to={item.href}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      item.active
                        ? 'bg-brand-50 dark:bg-brand-950 text-brand-500 shadow-sm'
                        : 'text-text-secondary hover:bg-surface-tertiary'
                    }`}
                  >
                    <item.icon className="w-4 h-4" /> {item.label}
                  </Link>
                </motion.div>
              ))}
              <motion.button
                custom={navItems.length}
                variants={sideVariants}
                initial="hidden"
                animate="show"
                onClick={logout}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors w-full"
              >
                <LogOut className="w-4 h-4" /> خروج
              </motion.button>
            </nav>
          </motion.div>
        </div>

        {/* ── Main Content ── */}
        <div className="flex-1 min-w-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex items-center justify-between mb-6"
          >
            <div>
              <h1 className="text-2xl font-bold text-text-primary">پیشخوان</h1>
              <p className="text-text-tertiary text-sm">خوش برگشتی! نمای کلی حساب شما.</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-text-tertiary bg-surface-secondary px-3 py-1.5 rounded-xl">
              <Clock className="w-4 h-4" />
              آخرین ۳۰ روز
            </div>
          </motion.div>

          {/* Stats grid with staggered entry */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            {MOCK_STATS.map((stat) => (
              <AnimatedStat key={stat.label} stat={stat} index={0} />
            ))}
          </motion.div>

          {/* Recent Listings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
            className="bg-surface rounded-2xl border border-border p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-brand-500" />
                <h2 className="text-lg font-bold text-text-primary">آگهی‌های اخیر</h2>
              </div>
              <Link to="/my-listings" className="flex items-center gap-1 text-sm text-brand-500 hover:text-brand-600 font-medium transition-colors">
                مشاهده همه
                <ChevronLeft className="w-4 h-4" />
              </Link>
            </div>
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="space-y-3"
            >
              {MOCK_LISTINGS.map((listing) => (
                <motion.div
                  key={listing.id}
                  variants={fadeUpItem}
                  whileHover={{ x: -4 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-secondary transition-colors will-change-transform"
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-tertiary shrink-0">
                    <img
                      src={listing.image}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-text-primary text-sm truncate">{listing.title}</h3>
                    <p className="text-brand-500 font-semibold text-sm">{listing.price}</p>
                    <div className="flex items-center gap-3 text-xs text-text-tertiary mt-0.5">
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {listing.views} بازدید</span>
                      <span>{listing.date}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${
                      listing.status === 'active' ? 'bg-accent-50 dark:bg-accent-950 text-accent-600 dark:text-accent-400' :
                      listing.status === 'pending' ? 'bg-yellow-50 dark:bg-yellow-950 text-yellow-600 dark:text-yellow-400' :
                      'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400'
                    }`}>
                      {listing.status === 'active' ? 'فعال' : listing.status === 'pending' ? 'در انتظار' : 'فروخته شده'}
                    </span>
                    <Link to={`/car/${listing.id}`} className="p-2 text-text-tertiary hover:text-text-secondary hover:bg-surface-tertiary rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
            className="bg-surface rounded-2xl border border-border p-6 mt-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-accent-500" />
              <h2 className="text-lg font-bold text-text-primary">فعالیت‌های اخیر</h2>
            </div>
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="space-y-4"
            >
              {[
                { action: 'پیام جدید دریافت شد', detail: 'کسی درباره تسلا مدل ۳ شما پرسیده', time: '۳۰ دقیقه پیش', icon: MessageCircle, color: 'text-brand-500', bg: 'bg-brand-50 dark:bg-brand-950' },
                { action: 'بازدید آگهی', detail: 'بامو X5 شما ۱۵ بازدید جدید داشته', time: '۲ ساعت پیش', icon: Eye, color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950' },
                { action: 'تایید آگهی', detail: 'مرسدس بنز C300 منتشر شد', time: '۱ روز پیش', icon: CheckCircle, color: 'text-accent-500 dark:text-accent-400', bg: 'bg-accent-50 dark:bg-accent-950' },
              ].map((activity, i) => (
                <motion.div
                  key={i}
                  variants={fadeUpItem}
                  whileHover={{ x: -4 }}
                  className="flex items-start gap-3 will-change-transform"
                >
                  <div className={`w-9 h-9 rounded-xl ${activity.bg} flex items-center justify-center shrink-0`}>
                    <activity.icon className={`w-4 h-4 ${activity.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">{activity.action}</p>
                    <p className="text-xs text-text-tertiary">{activity.detail}</p>
                  </div>
                  <span className="text-xs text-text-tertiary shrink-0">{activity.time}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
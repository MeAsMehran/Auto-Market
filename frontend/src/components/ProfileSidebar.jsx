import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Car, MessageCircle, Heart, Settings, LogOut, Sparkles, Plus, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { label: 'پیشخوان', icon: User, href: '/dashboard', active: false },
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

export default function ProfileSidebar({ activeHref }) {
  const { user, logout } = useAuth();

  return (
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
                  item.href === activeHref
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
  );
}

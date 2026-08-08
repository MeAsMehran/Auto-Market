import { useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Eye, TrendingUp, Edit2, CheckCircle, Activity, ChevronLeft, Car, MessageCircle, Heart, AlertCircle } from 'lucide-react';
import { staggerContainer, fadeUpItem } from '../components/AnimatedPage';
import ProfileSidebar from '../components/ProfileSidebar';
import { useStats } from '../context/StatsContext';
import { formatPrice, toPersianNumber, formatTimeAgo } from '../utils/format';

function AnimatedStat({ stat }) {
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
      <p className="text-2xl font-bold text-text-primary">{toPersianNumber(stat.value)}</p>
      <p className="text-sm text-text-tertiary">{stat.label}</p>
    </motion.div>
  );
}

export default function Dashboard() {
  const { stats, loading, error, fetchStats } = useStats();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  useLayoutEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const statsList = [
    { label: 'آگهی‌های فعال', value: stats.ads, icon: Car, color: 'text-brand-500', bg: 'bg-brand-50 dark:bg-brand-950', ring: 'ring-brand-500/20' },
    { label: 'تعداد بازدید', value: stats.totalViews, icon: Eye, color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950', ring: 'ring-blue-500/20' },
    { label: 'پیام‌ها', value: stats.messages, icon: MessageCircle, color: 'text-green-700 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-950', ring: 'ring-green-500/20' },
    { label: 'آگهی‌های پسندیده', value: stats.likes, icon: Heart, color: 'text-red-500 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950', ring: 'ring-red-500/20' },
  ];

  const getStatusLabel = (isActive, isSold) => {
    if (isSold) return { label: 'فروخته شده', class: 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400' };
    if (isActive) return { label: 'فعال', class: 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-800' };
    return { label: 'در انتظار', class: 'bg-yellow-50 dark:bg-yellow-950 text-yellow-600 dark:text-yellow-400' };
  };

  const getImageUrl = (car) => {
    if (car.images && car.images.length > 0) {
      return car.images[0].image;
    }
    if (car.first_image) {
      return car.first_image;
    }
    return 'https://via.placeholder.com/200x150?text=No+Image';
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <ProfileSidebar activeHref="/dashboard" />
          <div className="flex-1 min-w-0">
            <div className="animate-pulse space-y-6">
              <div className="h-20 bg-surface rounded-2xl" />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-32 bg-surface rounded-2xl" />
                ))}
              </div>
              <div className="h-64 bg-surface rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <ProfileSidebar activeHref="/dashboard" />
          <div className="flex-1 min-w-0">
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                تلاش مجدد
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <ProfileSidebar
          activeHref="/dashboard"
          stats={{
            ads: stats.ads,
            messages: stats.messages,
            likes: stats.likes,
          }}
        />

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
            {statsList.map((stat, index) => (
              <AnimatedStat key={stat.label} stat={stat} index={index} />
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

            {stats.latestAds.length === 0 ? (
              <div className="text-center py-8">
                <Car className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
                <p className="text-text-tertiary">هنوز آگهی فعالی ندارید</p>
                <Link
                  to="/post-ad"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
                >
                  <span>ثبت آگهی جدید</span>
                </Link>
              </div>
            ) : (
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="space-y-3"
              >
                {stats.latestAds.map((listing) => {
                  const statusInfo = getStatusLabel(listing.is_active, listing.is_sold);
                  return (
                    <motion.div
                      key={listing.id}
                      variants={fadeUpItem}
                      whileHover={{ x: -4 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-secondary transition-colors will-change-transform"
                    >
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-tertiary shrink-0">
                        <img
                          src={getImageUrl(listing)}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/200x150?text=No+Image';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {listing.brand && (
                            <span className="px-2 py-0.5 bg-brand-100 dark:bg-brand-900 text-brand-600 dark:text-brand-300 text-xs font-medium rounded-lg">
                              {listing.brand}
                            </span>
                          )}
                          {listing.model_name && (
                            <span className="px-2 py-0.5 bg-surface-tertiary text-text-secondary text-xs rounded-lg">
                              {listing.model_name}
                            </span>
                          )}
                        </div>
                        <h3 className="font-medium text-text-primary text-sm truncate">{listing.title}</h3>
                        <p className="text-brand-500 font-semibold text-sm">
                          {listing.price ? formatPrice(listing.price) : 'توافقی'}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-text-tertiary mt-0.5">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {toPersianNumber(listing.view_count || 0)} بازدید
                          </span>
                          <span>{formatTimeAgo(listing.created_at)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${statusInfo.class}`}>
                          {statusInfo.label}
                        </span>
                        <Link
                          to={`/car/${listing.id}`}
                          className="p-2 text-text-tertiary hover:text-text-secondary hover:bg-surface-tertiary rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
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
                { action: 'آگهی‌های فعال', detail: `شما ${toPersianNumber(stats.ads)} آگهی فعال دارید`, time: 'امروز', icon: CheckCircle, color: 'text-brand-500', bg: 'bg-brand-50 dark:bg-brand-950' },
                { action: 'بازدید کل', detail: `آگهی‌های شما ${toPersianNumber(stats.totalViews)} بازدید داشته`, time: 'این ماه', icon: Eye, color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950' },
                { action: 'آگهی‌های پسندیده', detail: `شما ${toPersianNumber(stats.likes)} آگهی را پسندیده‌اید`, time: 'تاکنون', icon: Heart, color: 'text-red-500 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950' },
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

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Car, MessageCircle, Heart, Settings, Clock, Eye, TrendingUp, Plus, Edit2, LogOut, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MOCK_STATS = [
  { label: 'آگهی‌های فعال', value: '۵', icon: Car, color: 'text-brand-500', bg: 'bg-brand-50 dark:bg-brand-950' },
  { label: 'تعداد بازدید', value: '۱,۲۴۷', icon: Eye, color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950' },
  { label: 'پیام‌ها', value: '۱۲', icon: MessageCircle, color: 'text-accent-500 dark:text-accent-400', bg: 'bg-accent-50 dark:bg-accent-950' },
  { label: 'جستجوهای ذخیره شده', value: '۳', icon: Heart, color: 'text-red-500 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950' },
];

const MOCK_LISTINGS = [
  { id: 1, title: '۲۰۲۲ تسلا مدل ۳ لانگ رنج', price: '$۴۵,۰۰۰', views: 342, status: 'active', date: '۲ روز پیش', image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=200&h=150&fit=crop' },
  { id: 2, title: '۲۰۲۱ بامو X5 xDrive40i', price: '$۳۸,۵۰۰', views: 156, status: 'active', date: '۱ هفته پیش', image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=200&h=150&fit=crop' },
  { id: 3, title: '۲۰۲۰ مرسدس بنز C300', price: '$۳۲,۰۰۰', views: 89, status: 'pending', date: '۲ هفته پیش', image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=200&h=150&fit=crop' },
];

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-64 shrink-0">
          <div className="bg-surface rounded-2xl border border-border p-6 sticky top-20">
            <div className="text-center mb-6 pb-6 border-b border-border">
              <div className="w-20 h-20 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center mx-auto mb-3">
                <User className="w-8 h-8 text-brand-500" />
              </div>
              <h2 className="font-bold text-text-primary">{user?.name || 'کاربر'}</h2>
              <p className="text-sm text-text-tertiary">{user?.phone || '+۹۸ ۹۱۲ ۳۴۵ ۶۷۸۹'}</p>
              <Link to="/post-ad" className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-xl transition-colors">
                <Plus className="w-4 h-4" /> آگهی جدید
              </Link>
            </div>
            <nav className="space-y-1">
              {[
                { label: 'پیشخوان', icon: User, href: '/dashboard', active: true },
                { label: 'آگهی‌های من', icon: Car, href: '/my-listings', active: false },
                { label: 'پیام‌ها', icon: MessageCircle, href: '/chat', active: false },
                { label: 'علاقه‌مندی‌ها', icon: Heart, href: '#', active: false },
                { label: 'تنظیمات', icon: Settings, href: '/settings', active: false },
              ].map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${item.active ? 'bg-brand-50 dark:bg-brand-950 text-brand-500' : 'text-text-secondary hover:bg-surface-tertiary'}`}
                >
                  <item.icon className="w-4 h-4" /> {item.label}
                </Link>
              ))}
              <button onClick={logout} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors w-full">
                <LogOut className="w-4 h-4" /> خروج
              </button>
            </nav>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">پیشخوان</h1>
              <p className="text-text-tertiary text-sm">خوش برگشتی! نمای کلی حساب شما.</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-text-tertiary">
              <Clock className="w-4 h-4" />
              آخرین ۳۰ روز
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {MOCK_STATS.map((stat) => (
              <div key={stat.label} className="bg-surface rounded-2xl border border-border p-5">
                <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
                <p className="text-sm text-text-tertiary">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-surface rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text-primary">آگهی‌های اخیر</h2>
              <Link to="/my-listings" className="text-sm text-brand-500 hover:text-brand-600 font-medium">مشاهده همه</Link>
            </div>
            <div className="space-y-4">
              {MOCK_LISTINGS.map((listing) => (
                <div key={listing.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-secondary transition-colors">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-tertiary shrink-0">
                    <img src={listing.image} alt="" className="w-full h-full object-cover" />
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
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface rounded-2xl border border-border p-6 mt-6">
            <h2 className="text-lg font-bold text-text-primary mb-4">فعالیت‌های اخیر</h2>
            <div className="space-y-4">
              {[
                { action: 'پیام جدید دریافت شد', detail: 'کسی درباره تسلا مدل ۳ شما پرسیده', time: '۳۰ دقیقه پیش', icon: MessageCircle, color: 'text-brand-500' },
                { action: 'بازدید آگهی', detail: 'بامو X5 شما ۱۵ بازدید جدید داشته', time: '۲ ساعت پیش', icon: Eye, color: 'text-blue-500 dark:text-blue-400' },
                { action: 'تایید آگهی', detail: 'مرسدس بنز C300 منتشر شد', time: '۱ روز پیش', icon: CheckCircle, color: 'text-accent-500 dark:text-accent-400' },
              ].map((activity, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg bg-surface-tertiary flex items-center justify-center shrink-0 ${activity.color}`}>
                    <activity.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">{activity.action}</p>
                    <p className="text-xs text-text-tertiary">{activity.detail}</p>
                  </div>
                  <span className="text-xs text-text-tertiary shrink-0">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

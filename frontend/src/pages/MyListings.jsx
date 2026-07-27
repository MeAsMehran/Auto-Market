import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Eye, Edit3, Trash2, Search, ChevronDown, SlidersHorizontal, Clock, MapPin, TrendingUp, CheckCircle, XCircle } from 'lucide-react';

const MOCK_LISTINGS = [
  { id: 1, title: '۲۰۲۲ تسلا مدل ۳ لانگ رنج', price: '$۴۵,۰۰۰', views: 342, status: 'active', date: '۲ روز پیش', expires: '۲۸ روز', image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&h=300&fit=crop', location: 'تهران' },
  { id: 2, title: '۲۰۲۱ بامو X5 xDrive40i', price: '$۳۸,۵۰۰', views: 156, status: 'active', date: '۱ هفته پیش', expires: '۲۳ روز', image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=300&fit=crop', location: 'مشهد' },
  { id: 3, title: '۲۰۲۰ مرسدس بنز C300', price: '$۳۲,۰۰۰', views: 89, status: 'pending', date: '۲ هفته پیش', expires: '--', image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&h=300&fit=crop', location: 'کرج' },
  { id: 4, title: '۲۰۱۹ تویوتا کمری LE', price: '$۲۲,۰۰۰', views: 45, status: 'sold', date: '۱ ماه پیش', expires: '--', image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=300&fit=crop', location: 'اصفهان' },
  { id: 5, title: '۲۰۲۳ هیوندای النترا SEL', price: '$۲۴,۵۰۰', views: 210, status: 'active', date: '۳ روز پیش', expires: '۲۷ روز', image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&h=300&fit=crop', location: 'شیراز' },
];

export default function MyListings() {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = MOCK_LISTINGS.filter((l) => {
    if (filter !== 'all' && l.status !== filter) return false;
    if (searchQuery && !l.title.includes(searchQuery)) return false;
    return true;
  });

  const statusCounts = {
    all: MOCK_LISTINGS.length,
    active: MOCK_LISTINGS.filter((l) => l.status === 'active').length,
    pending: MOCK_LISTINGS.filter((l) => l.status === 'pending').length,
    sold: MOCK_LISTINGS.filter((l) => l.status === 'sold').length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">آگهی‌های من</h1>
          <p className="text-text-tertiary text-sm">مدیریت آگهی‌های خودروی شما</p>
        </div>
        <Link to="/post-ad" className="flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-colors">
          <Plus className="w-4 h-4" /> آگهی جدید
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex gap-1 bg-surface-tertiary rounded-xl p-1 overflow-x-auto scrollbar-hide">
          {['all', 'active', 'pending', 'sold'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${filter === s ? 'bg-surface text-text-primary shadow-sm' : 'text-text-tertiary hover:text-text-secondary'}`}
            >
              {s === 'all' ? 'همه' : s === 'active' ? 'فعال' : s === 'pending' ? 'در انتظار' : 'فروخته شده'}
              <span className="mr-1.5 text-xs opacity-60">({statusCounts[s]})</span>
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="جستجوی آگهی‌ها..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2 bg-surface-tertiary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-surface rounded-2xl border border-border">
          <Search className="w-10 h-10 mx-auto text-text-tertiary mb-3" />
          <h3 className="font-semibold text-text-primary">آگهی‌ای یافت نشد</h3>
          <p className="text-text-secondary text-sm mt-1">فیلترها را تغییر دهید.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((listing) => (
            <div key={listing.id} className="bg-surface rounded-2xl border border-border p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="sm:w-32 h-24 rounded-xl overflow-hidden bg-surface-tertiary shrink-0">
                  <img src={listing.image} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link to={`/car/${listing.id}`} className="font-semibold text-text-primary hover:text-brand-500 transition-colors line-clamp-1">{listing.title}</Link>
                      <p className="text-brand-500 font-bold text-lg mt-0.5">{listing.price}</p>
                    </div>
                    <span className={`shrink-0 px-2.5 py-1 text-xs font-medium rounded-lg ${
                      listing.status === 'active' ? 'bg-accent-50 dark:bg-accent-950 text-accent-600 dark:text-accent-400' :
                      listing.status === 'pending' ? 'bg-yellow-50 dark:bg-yellow-950 text-yellow-600 dark:text-yellow-400' :
                      'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400'
                    }`}>
                      {listing.status === 'active' ? 'فعال' : listing.status === 'pending' ? 'در انتظار' : 'فروخته شده'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-text-tertiary mt-2">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {listing.location}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {listing.date}</span>
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {listing.views} بازدید</span>
                    {listing.status === 'active' && (
                      <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> انقضا در {listing.expires}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                    <Link to={`/car/${listing.id}`} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-tertiary rounded-lg transition-colors">
                      <Eye className="w-3.5 h-3.5" /> مشاهده
                    </Link>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-tertiary rounded-lg transition-colors">
                      <Edit3 className="w-3.5 h-3.5" /> ویرایش
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors mr-auto">
                      <Trash2 className="w-3.5 h-3.5" /> حذف
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

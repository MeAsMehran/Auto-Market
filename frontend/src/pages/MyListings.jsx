import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Eye, Edit3, Trash2, Search, ChevronLeft, ChevronRight, Clock, MapPin, Loader2, AlertCircle, Car } from 'lucide-react';
import { getMyListings, deleteCar } from '../lib/carApi';
import { FUEL_LABELS, CITY_LABELS, COLOR_LABELS } from '../lib/constants';
import { getFirstImage, fixImageUrl } from '../components/CarCard';

const ITEMS_PER_PAGE = 5;

function formatPrice(price) {
  if (!price) return 'قیمت توافقی';
  return `${(price / 1000000).toLocaleString('fa-IR')} م.تومان`;
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} دقیقه پیش`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ساعت پیش`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} روز پیش`;
  return `${Math.floor(days / 30)} ماه پیش`;
}

export default function MyListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  useEffect(() => {
    fetchListings();
  }, [page]);

  const fetchListings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyListings(page);
      if (Array.isArray(data)) {
        setListings(data);
        setTotalCount(data.length);
      } else {
        setListings(data.results || []);
        setTotalCount(data.count || 0);
      }
    } catch (err) {
      setError('خطا در دریافت آگهی‌ها. لطفاً دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteCar(id);
      setListings((prev) => prev.filter((l) => l.id !== id));
      setTotalCount((prev) => prev - 1);
      setDeleteConfirm(null);
    } catch {
      setError('خطا در حذف آگهی.');
    }
  };

  const filtered = searchQuery
    ? listings.filter((l) => l.title?.includes(searchQuery) || l.brand?.includes(searchQuery))
    : listings;

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

      <div className="flex gap-4 mb-6">
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

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-3" />
          <p className="text-text-secondary text-sm">در حال بارگذاری آگهی‌ها...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-surface rounded-2xl border border-border">
          <Car className="w-10 h-10 mx-auto text-text-tertiary mb-3" />
          <h3 className="font-semibold text-text-primary">آگهی‌ای یافت نشد</h3>
          <p className="text-text-secondary text-sm mt-1">
            {searchQuery ? 'جستجوی خود را تغییر دهید.' : 'هنوز آگهی ثبت نکرده‌اید.'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {filtered.map((listing) => (
              <div key={listing.id} className="bg-surface rounded-2xl border border-border p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="sm:w-32 h-24 rounded-xl overflow-hidden bg-surface-tertiary shrink-0">
                    {getFirstImage(listing) ? (
                      <img src={getFirstImage(listing)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Car className="w-8 h-8 text-text-tertiary/30" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link to={`/car/${listing.id}`} className="font-semibold text-text-primary hover:text-brand-500 transition-colors line-clamp-1">{listing.title}</Link>
                        <p className="text-brand-500 font-bold text-lg mt-0.5">{formatPrice(listing.price)}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-text-tertiary mt-2">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {CITY_LABELS[listing.city] || listing.city}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {timeAgo(listing.created_at)}</span>
                      <span className="px-2 py-0.5 bg-surface-tertiary text-text-secondary text-xs rounded-lg">{FUEL_LABELS[listing.fuel_type] || listing.fuel_type}</span>
                      <span className="px-2 py-0.5 bg-surface-tertiary text-text-secondary text-xs rounded-lg">{COLOR_LABELS[listing.color] || listing.color}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                      <Link to={`/car/${listing.id}`} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-tertiary rounded-lg transition-colors">
                        <Eye className="w-3.5 h-3.5" /> مشاهده
                      </Link>
                      <Link to={`/my-listings/${listing.id}/edit`} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-tertiary rounded-lg transition-colors">
                        <Edit3 className="w-3.5 h-3.5" /> ویرایش
                      </Link>
                      {deleteConfirm === listing.id ? (
                        <div className="flex items-center gap-2 mr-auto">
                          <span className="text-xs text-red-500">آیا مطمئنید؟</span>
                          <button onClick={() => handleDelete(listing.id)} className="px-3 py-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors">بله</button>
                          <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1.5 text-xs font-medium text-text-secondary border border-border hover:bg-surface-tertiary rounded-lg transition-colors">خیر</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirm(listing.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors mr-auto">
                          <Trash2 className="w-3.5 h-3.5" /> حذف
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-xl border border-border hover:bg-surface-tertiary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors ${page === p ? 'bg-brand-500 text-white' : 'border border-border hover:bg-surface-tertiary text-text-secondary'}`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-xl border border-border hover:bg-surface-tertiary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

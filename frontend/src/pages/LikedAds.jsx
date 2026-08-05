import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ArrowRight, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { CITY_LABELS, FUEL_LABELS } from '../lib/constants';
import { getFirstImage } from '../components/CarCard';
import { useFavorites } from '../context/FavoritesContext';
import { useLikedAds } from '../hooks/useLikedAds';

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

export default function LikedAds() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, parseInt(searchParams.get('page')) || 1);

  const { cars, count, totalPages, loading, error, refetch } = useLikedAds(page);
  const { toggleLike } = useFavorites();

  const setPage = (p) => {
    setSearchParams((prev) => { prev.set('page', String(p)); return prev; });
  };

  const removeLike = async (car) => {
    await toggleLike(car);
    refetch();
  };

  return (
    <div className="min-h-screen bg-surface-secondary">
      <section className="bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 fill-white" />
              </div>
              <h1 className="text-2xl font-bold">خودروهای مورد علاقه</h1>
            </div>
            <p className="text-brand-100 max-w-2xl">
              خودروهای ذخیره‌شده شما در اینجا نمایش داده می‌شوند. می‌توانید به راحتی آن‌ها را مقایسه کرده و با فروشندگان تماس بگیرید.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-text-secondary">در حال بارگذاری...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500 mb-4">{error}</p>
            <button onClick={refetch} className="px-4 py-2 bg-brand-500 text-white rounded-lg">تلاش دوباره</button>
          </div>
        ) : cars.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-text-tertiary" />
            </div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">هنوز خودرویی را پسند نکرده‌اید</h2>
            <p className="text-text-secondary mb-6">برای مشاهده خودروها و ذخیره موارد مورد علاقه، از آگهی‌ها دیدن کنید.</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
            >
              <span>مشاهده آگهی‌ها</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-text-primary">
                {count} خودرو ذخیره‌شده
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {cars.map((car, index) => (
                <LikedCarCard
                  key={car.id}
                  car={car}
                  index={index}
                  onRemove={() => removeLike(car)}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
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
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
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
    </div>
  );
}

function LikedCarCard({ car, index, onRemove }) {
  const imgSrc = getFirstImage(car);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: 'easeOut' }}
    >
      <Link
        to={`/car/${car.id}`}
        className="group block bg-surface rounded-2xl border border-border overflow-hidden hover:shadow-lg hover:border-brand-500/30 transition-all duration-300 relative"
      >
        <div className="absolute top-3 left-3 z-10">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove(car);
            }}
            className="w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors shadow-lg"
          >
            <Heart className="w-4 h-4 fill-white text-white" />
          </button>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden bg-surface-tertiary">
          {imgSrc ? (
            <img src={imgSrc} alt={car.title} className="w-full h-full object-cover" />
          ) : null}
          {car.is_featured && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-3 right-3 bg-brand-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-md"
            >
              ویژه
            </motion.span>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-text-primary text-sm leading-snug mb-1 line-clamp-2 group-hover:text-brand-500 transition-colors">
            {car.title}
          </h3>
          <p className="text-lg font-bold text-brand-500 mb-2">{formatPrice(car.price)}</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span className="px-2 py-0.5 bg-surface-tertiary text-text-secondary text-xs rounded-lg">{car.year}</span>
            <span className="px-2 py-0.5 bg-surface-tertiary text-text-secondary text-xs rounded-lg">{car.mileage?.toLocaleString('fa-IR')} ک.م</span>
            <span className="px-2 py-0.5 bg-surface-tertiary text-text-secondary text-xs rounded-lg">{FUEL_LABELS[car.fuel_type] || car.fuel_type}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-text-tertiary">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {CITY_LABELS[car.city] || car.city}
            </span>
            {car.created_at && (
              <span className="flex items-center gap-1">{timeAgo(car.created_at)}</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

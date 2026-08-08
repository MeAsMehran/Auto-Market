import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, SlidersHorizontal, Grid3X3, List, MapPin, Clock,
  ChevronLeft, ChevronRight, AlertCircle, Car, Truck, Star, Shield, Users, TrendingUp
} from 'lucide-react';
import { getCars } from '../lib/carApi';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { CarGridCard, CarListCard } from '../components/CarCard';
import CarSpinner from '../components/CarSpinner';
import { staggerContainer } from '../components/AnimatedPage';
import { CITY_LABELS } from '../lib/constants';
import { formatPrice, toPersianNumber } from '../utils/format';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useAuth } from '../context/AuthContext';

const MOCK_CARS = [
  { id: 1, title: '۲۰۲۲ تسلا مدل ۳ لانگ رنج', price: 4500000000, year: 2022, mileage: 12000, fuel_type: 'electric', transmission: 'automatic', city: 'تهران', created_at: '2026-07-27T10:00:00Z', image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&h=300&fit=crop', color: 'سفید', is_featured: true, brand: 'تسلا', model: 'مدل ۳' },
  { id: 2, title: '۲۰۲۱ بامو X5 xDrive40i', price: 3850000000, year: 2021, mileage: 25000, fuel_type: 'petrol', transmission: 'automatic', city: 'مشهد', created_at: '2026-07-27T07:00:00Z', image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=300&fit=crop', color: 'مشکی', is_featured: false, brand: 'بامو', model: 'X5' },
  { id: 3, title: '۲۰۲۳ تویوتا کمری LE', price: 2800000000, year: 2023, mileage: 8000, fuel_type: 'hybrid', transmission: 'automatic', city: 'کرج', created_at: '2026-07-26T10:00:00Z', image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=300&fit=crop', color: 'نقره‌ای', is_featured: true, brand: 'تویوتا', model: 'کمری' },
  { id: 4, title: '۲۰۲۰ مرسدس بنز C300', price: 3200000000, year: 2020, mileage: 32000, fuel_type: 'petrol', transmission: 'automatic', city: 'تهران', created_at: '2026-07-25T10:00:00Z', image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&h=300&fit=crop', color: 'خاکستری', is_featured: false, brand: 'مرسدس بنز', model: 'C300' },
  { id: 5, title: '۲۰۲۲ هیوندای النترا SEL', price: 2250000000, year: 2022, mileage: 15000, fuel_type: 'petrol', transmission: 'automatic', city: 'اصفهان', created_at: '2026-07-27T06:00:00Z', image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&h=300&fit=crop', color: 'آبی', is_featured: false, brand: 'هیوندای', model: 'النترا' },
  { id: 6, title: '۲۰۲۱ نیسان آلتیما SR', price: 2480000000, year: 2021, mileage: 28000, fuel_type: 'petrol', transmission: 'cvt', city: 'شیراز', created_at: '2026-07-26T10:00:00Z', image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&h=300&fit=crop', color: 'قرمز', is_featured: false, brand: 'نیسان', model: 'آلتیما' },
  { id: 7, title: '۲۰۲۳ فورد ماستنگ GT', price: 5200000000, year: 2023, mileage: 4000, fuel_type: 'petrol', transmission: 'manual', city: 'تهران', created_at: '2026-07-27T00:00:00Z', image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop', color: 'زرد', is_featured: true, brand: 'فورد', model: 'ماستنگ' },
  { id: 8, title: '۲۰۲۰ آئودی Q5 پریمیوم پلاس', price: 3500000000, year: 2020, mileage: 30000, fuel_type: 'petrol', transmission: 'automatic', city: 'تبریز', created_at: '2026-07-24T10:00:00Z', image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=300&fit=crop', color: 'سفید', is_featured: false, brand: 'آئودی', model: 'Q5' },
  { id: 9, title: '۲۰۲۲ کیا اسپورتیج EX', price: 2750000000, year: 2022, mileage: 18000, fuel_type: 'petrol', transmission: 'automatic', city: 'رشت', created_at: '2026-07-26T10:00:00Z', image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&h=300&fit=crop', color: 'سبز', is_featured: false, brand: 'کیا', model: 'اسپورتیج' },
  { id: 10, title: '۲۰۲۱ شورلت تاهو LT', price: 5500000000, year: 2021, mileage: 22000, fuel_type: 'petrol', transmission: 'automatic', city: 'اهواز', created_at: '2026-07-22T10:00:00Z', image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&h=300&fit=crop', color: 'مشکی', is_featured: false, brand: 'شورلت', model: 'تاهو' },
];

const brands = ['تسلا', 'بامو', 'تویوتا', 'مرسدس بنز', 'هیوندای', 'نیسان', 'فورد', 'آئودی', 'کیا', 'شورلت'];

const bodyTypes = [
  { key: 'sedan', label: 'سدان', icon: Car },
  { key: 'suv', label: 'شاسی‌بلند', icon: Truck },
  { key: 'hatchback', label: 'هاچ‌بک', icon: Car },
  { key: 'crossover', label: 'کراس‌اوور', icon: Truck },
  { key: 'pickup', label: 'وانت', icon: Truck },
  { key: 'coupe', label: 'کوپه', icon: Car },
];

function CarSilhouette({ className = '', speed = 14, delay = 0, size = 200, y = 0, reducedMotion = false }) {
  return (
    <motion.div
      className={`absolute pointer-events-none ${className}`}
      style={{ bottom: `${y}px` }}
      animate={reducedMotion ? {} : { x: ['-20%', '110%'] }}
      transition={{ duration: speed, repeat: Infinity, ease: 'linear', delay }}
    >
      <svg width={size} height={size * 0.4} viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg"
           style={{ transform: 'scaleX(-1)' }}>
        <defs>
          <filter id={`glow-hl-${size}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={`glow-tl-${size}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id={`body-grad-${size}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0.95" />
            <stop offset="100%" stopColor="white" stopOpacity="0.7" />
          </linearGradient>
        </defs>

        <ellipse cx="100" cy="74" rx="80" ry="4" fill="black" opacity="0.15" />
        <rect x="20" y="38" width="140" height="30" rx="6" fill={`url(#body-grad-${size})`} />
        <path d="M55 38 L72 14 L140 14 L155 38" fill="white" opacity="0.9" />
        <path d="M74 16 L60 36 L105 36 L105 16Z" fill="white" opacity="0.5" />
        <path d="M108 16 L108 36 L148 36 L138 16Z" fill="white" opacity="0.4" />
        <line x1="106" y1="38" x2="106" y2="64" stroke="white" strokeWidth="0.5" opacity="0.3" />
        <rect x="155" y="42" width="8" height="6" rx="2" fill="#ef4444" filter={`url(#glow-tl-${size})`} opacity="0.9" />
        <rect x="155" y="42" width="12" height="6" rx="2" fill="#ef4444" opacity="0.25" />
        <rect x="16" y="42" width="6" height="6" rx="2" fill="#fbbf24" filter={`url(#glow-hl-${size})`} opacity="0.95" />
        <rect x="12" y="42" width="8" height="6" rx="2" fill="#fbbf24" opacity="0.3" />
        <circle cx="140" cy="68" r="10" fill="white" opacity="0.85" />
        <circle cx="140" cy="68" r="5" fill="white" opacity="0.4" />
        <line x1="140" y1="60" x2="140" y2="76" stroke="white" strokeWidth="0.8" opacity="0.4" />
        <line x1="132" y1="68" x2="148" y2="68" stroke="white" strokeWidth="0.8" opacity="0.4" />
        <circle cx="52" cy="68" r="10" fill="white" opacity="0.85" />
        <circle cx="52" cy="68" r="5" fill="white" opacity="0.4" />
        <line x1="52" y1="60" x2="52" y2="76" stroke="white" strokeWidth="0.8" opacity="0.4" />
        <line x1="44" y1="68" x2="60" y2="68" stroke="white" strokeWidth="0.8" opacity="0.4" />
      </svg>
    </motion.div>
  );
}

function RoadLines({ reducedMotion = false }) {
  return (
    <div className="absolute bottom-0 left-0 w-full pointer-events-none overflow-hidden">
      <div className="h-3 bg-white/5" />
      <div className="relative h-1 opacity-50">
        <motion.div
          className="absolute inset-0 w-[200%]"
          style={{
            background:
              'repeating-linear-gradient(90deg, rgba(255,255,255,0.8) 0px, rgba(255,255,255,0.8) 40px, transparent 40px, transparent 80px)',
          }}
          animate={reducedMotion ? {} : { x: [0, -80] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    </div>
  );
}

function FeaturedMarquee({ cars, reducedMotion = false }) {
  const featured = cars.filter((c) => c.is_featured);
  const items = [...featured, ...featured];
  return (
    <section className="py-8 overflow-hidden bg-surface border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-4">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
          <h2 className="text-lg font-bold text-text-primary">آگهی‌های ویژه</h2>
        </div>
      </div>
      <div className="relative">
        <motion.div
          className="flex gap-5 w-max"
          animate={reducedMotion ? {} : { x: ['0%', '-50%'] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        >
          {items.map((car, i) => (
            <Link
              to={`/car/${car.id}`}
              key={`${car.id}-${i}`}
              className="w-64 shrink-0 block"
            >
              <div className="bg-surface rounded-xl border border-border overflow-hidden hover:shadow-md hover:border-brand-500/30 transition-all">
                <div className="relative h-36 overflow-hidden">
                  <img
                    src={car.image || car.images?.[0]?.image || 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&h=300&fit=crop'}
                    alt={car.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Star className="w-2.5 h-2.5 fill-white" /> ویژه
                  </span>
                </div>
                <div className="p-3">
                  <h3 className="text-xs font-semibold text-text-primary line-clamp-1">{car.title}</h3>
                  <p className="text-sm font-bold text-brand-500 mt-1">{formatPrice(car.price)}</p>
                  <p className="text-[10px] text-text-tertiary mt-1 flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5" /> {CITY_LABELS[car.city] || car.city}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </motion.div>
        <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-surface to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-surface to-transparent pointer-events-none" />
      </div>
    </section>
  );
}

export default function Home() {
  const { user } = useAuth();
  const reducedMotion = useReducedMotion();
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState('grid');
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get('brand') || '');
  const [selectedBody, setSelectedBody] = useState(searchParams.get('body') || '');
  const [priceRange, setPriceRange] = useState({
    min: searchParams.get('min_price') || '',
    max: searchParams.get('max_price') || '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [useMock, setUseMock] = useState(false);

  const listingsRef = useRef(null);
  const prevPageRef = useRef(page);
  const pageSize = 20;
  const inFlightRef = useRef(new Set());
  const latestKeyRef = useRef('');

  // Debounce price inputs so typing doesn't fire a request per keystroke.
  const debouncedMinPrice = useDebouncedValue(priceRange.min, 400);
  const debouncedMaxPrice = useDebouncedValue(priceRange.max, 400);

  // Scroll to top on initial mount (on refresh/navigation).
  // Runs synchronously before paint and jumps instantly so it never
  // visibly animates/fights the browser's own scroll handling.
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  // Scroll to the listings section header (with offset for fixed header) when page changes.
  // Compares against the previous page instead of a first-render flag: React StrictMode
  // double-fires mount effects in dev, which made a boolean guard scroll down on refresh.
  useEffect(() => {
    if (prevPageRef.current === page) return;
    prevPageRef.current = page;
    if (listingsRef.current) {
      const offset = 80; // pixels above the section to keep visible (header height + breathing room)
      const top = listingsRef.current.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }, [page]);

  const fetchCars = useCallback(async (overrides = {}) => {
    const params = {
      search: overrides.search ?? (searchQuery || undefined),
      brand: selectedBrand || undefined,
      body_type: selectedBody || undefined,
      min_price: debouncedMinPrice || undefined,
      max_price: debouncedMaxPrice || undefined,
      page: overrides.page ?? page,
      page_size: pageSize,
    };

    const key = JSON.stringify(params);

    // Skip duplicate requests that are already in flight for the exact same
    // params (StrictMode double-effects, filter+page reset overlap).
    if (inFlightRef.current.has(key)) return;
    inFlightRef.current.add(key);
    latestKeyRef.current = key;

    setLoading(true);
    setError(null);
    try {
      const data = await getCars(params);
      if (latestKeyRef.current !== key) return; // superseded by a newer request
      if (data.results) {
        setCars(data.results);
        setTotalCount(data.count || 0);
      } else if (Array.isArray(data)) {
        setCars(data);
        setTotalCount(data.length);
      }
      setUseMock(false);
    } catch {
      if (latestKeyRef.current !== key) return;
      setUseMock(true);
      setCars(MOCK_CARS);
      setTotalCount(MOCK_CARS.length);
    } finally {
      inFlightRef.current.delete(key);
      if (latestKeyRef.current === key) setLoading(false);
    }
  }, [searchQuery, selectedBrand, selectedBody, debouncedMinPrice, debouncedMaxPrice, page]);

  // Keep the search box in sync with the URL (e.g. Navbar search).
  useEffect(() => {
    setSearchQuery(searchParams.get('search') || '');
  }, [searchParams]);

  // Any filter change resets to the first page and fetches it right away.
  // Note: fetchCars is intentionally omitted — its identity changes alongside
  // these deps, and including it would double-fire with the page effect below.
  useEffect(() => {
    setPage(1);
    fetchCars({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBrand, selectedBody, debouncedMinPrice, debouncedMaxPrice, searchQuery]);

  // Pagination (and re-fetch after filter-driven page resets).
  useEffect(() => {
    fetchCars({ page });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchQuery) params.set('search', searchQuery);
    else params.delete('search');
    setSearchParams(params);
  };

  const handleBodyTypeClick = (key) => setSelectedBody(selectedBody === key ? '' : key);

  const clearFilters = () => {
    setSelectedBrand('');
    setSelectedBody('');
    setPriceRange({ min: '', max: '' });
    setSearchQuery('');
    setSearchParams({});
  };

  const filteredCars = useMock
    ? MOCK_CARS.filter((car) => {
        if (selectedBrand && !car.brand?.includes(selectedBrand)) return false;
        if (selectedBody && car.body_type !== selectedBody) return false;
        if (searchQuery && !car.title.includes(searchQuery) && !car.city?.includes(searchQuery)) return false;
        return true;
      })
    : cars;

  const totalPages = useMock ? 1 : Math.ceil(totalCount / pageSize);
  const isFilterActive = selectedBrand || selectedBody || priceRange.min || priceRange.max || searchQuery;

  return (
    <div>
      {/* ── Hero Section ── */}
      <section className="relative bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 text-white overflow-hidden">
        <div className="absolute bottom-0 left-0 w-full h-24 pointer-events-none">
          <CarSilhouette speed={18} delay={0} size={220} y={0} reducedMotion={reducedMotion} />
          <CarSilhouette speed={13} delay={5} size={160} y={32} reducedMotion={reducedMotion} />
          <CarSilhouette speed={24} delay={10} size={190} y={14} reducedMotion={reducedMotion} />
          <RoadLines reducedMotion={reducedMotion} />
        </div>

        <motion.div
          className="absolute -top-32 -right-32 w-96 h-96 bg-white/5 rounded-full blur-3xl"
          animate={reducedMotion ? {} : { scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-24 -left-24 w-72 h-72 bg-white/5 rounded-full blur-3xl"
          animate={reducedMotion ? {} : { scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20 relative z-10">
          <motion.div
            className="max-w-2xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <motion.h1
              className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              خودرو مورد علاقت رو پیدا کن
            </motion.h1>
            <motion.p
              className="text-lg text-brand-200 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              هزاران آگهی از فروشندگان معتبر در سراسر کشور را مرور کنید.
            </motion.p>
            <motion.form
              onSubmit={handleSearchSubmit}
              className="bg-surface rounded-2xl p-2 shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
            >
              <div className="flex-1 relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                <input
                  type="text"
                  placeholder="جستجو بر اساس برند، مدل یا مکان..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-12 pl-10 py-3.5 text-text-primary rounded-xl focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchParams({});
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-text-tertiary hover:text-text-secondary rounded-full hover:bg-surface-tertiary transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
            </motion.form>
          </motion.div>
        </div>
      </section>

      {/* ── Featured Marquee ── */}
      <FeaturedMarquee cars={MOCK_CARS} reducedMotion={reducedMotion} />

      {/* ── Listings ── */}
      <div ref={listingsRef} className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* ── Filters Panel ── */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden bg-surface-secondary border border-border rounded-2xl mb-6 shadow-sm"
            >
              <div className="px-5 py-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-text-primary">فیلترها</h3>
                  <button onClick={() => setShowFilters(false)} className="text-text-tertiary hover:text-text-secondary">
                    <span className="text-2xl leading-none">&times;</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">برند</label>
                    <select
                      value={selectedBrand}
                      onChange={(e) => setSelectedBrand(e.target.value)}
                      className="w-full px-4 py-2.5 bg-surface-tertiary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    >
                      <option value="">همه برندها</option>
                      {brands.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">حداقل قیمت (تومان)</label>
                    <input
                      type="number"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                      placeholder="۰"
                      className="w-full px-4 py-2.5 bg-surface-tertiary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">حداکثر قیمت (تومان)</label>
                    <input
                      type="number"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                      placeholder="نامحدود"
                      className="w-full px-4 py-2.5 bg-surface-tertiary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={clearFilters}
                      className="w-full px-4 py-2.5 text-sm text-text-secondary border border-border rounded-xl hover:bg-surface-tertiary transition-colors"
                    >
                      پاک کردن همه
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            {isFilterActive ? (
              <h2 className="text-xl font-bold text-text-primary">
                {filteredCars.length > 0 ? `همه آگهی‌ها (${useMock ? toPersianNumber(filteredCars.length) : toPersianNumber(totalCount)})` : 'آگهی‌ای یافت نشد'}
              </h2>
            ) : (
              <h2 className="text-xl font-bold text-text-primary">همه آگهی‌ها</h2>
            )}
            <p className="text-sm text-text-tertiary mt-0.5">جدیدترین خودروهای اضافه شده توسط کاربران</p>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                showFilters
                  ? 'bg-brand-500 text-white border-brand-500'
                  : 'bg-surface-tertiary text-text-secondary border-border hover:border-brand-500/50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>فیلترها</span>
            </motion.button>
            <div className="flex items-center gap-2 bg-surface-tertiary rounded-xl p-1">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-surface shadow-sm text-brand-500' : 'text-text-tertiary hover:text-text-secondary'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-surface shadow-sm text-brand-500' : 'text-text-tertiary hover:text-text-secondary'}`}
              >
                <List className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </div>

        <div className="mt-6 -mx-4 sm:-mx-6 px-4 sm:px-6 flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
          {bodyTypes.map(({ key, label, icon: Icon }) => (
            <motion.button
              key={key}
              onClick={() => handleBodyTypeClick(key)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium whitespace-nowrap transition-all ${
                selectedBody === key
                  ? 'bg-brand-500 text-white border-brand-500 shadow-md shadow-brand-500/25'
                  : 'bg-surface text-text-secondary border-border hover:border-brand-500/50 hover:text-brand-500'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </motion.button>
          ))}
        </div>

        {loading && (
          <div className="py-20 flex justify-center">
            <CarSpinner />
          </div>
        )}

        {!loading && error && (
          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 px-4 py-3 rounded-xl text-sm mb-6 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error} — در حال نمایش داده‌های نمونه</span>
          </div>
        )}

        {!loading && filteredCars.length === 0 && (
          <div className="text-center py-20">
            <Search className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-1">آگهی‌ای یافت نشد</h3>
            <p className="text-text-secondary mb-4">فیلترها یا عبارت جستجو را تغییر دهید.</p>
            <button onClick={clearFilters} className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-medium transition-colors">
              پاک کردن فیلترها
            </button>
          </div>
        )}

        {!loading && filteredCars.length > 0 && viewMode === 'grid' && (
          <motion.div
            key={`grid-${page}`}
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.05 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          >
            {filteredCars.map((car) => (
              <CarGridCard key={car.id} car={car} isOwner={user && car.seller_id === user.id} />
            ))}
          </motion.div>
        )}

        {!loading && filteredCars.length > 0 && viewMode === 'list' && (
          <motion.div
            key={`list-${page}`}
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.05 }}
            className="space-y-4"
          >
            {filteredCars.map((car) => (
              <CarListCard key={car.id} car={car} isOwner={user && car.seller_id === user.id} />
            ))}
          </motion.div>
        )}

        {!loading && !useMock && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="p-2 rounded-xl border border-border hover:bg-surface-tertiary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-text-secondary" />
            </motion.button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNum;
              if (totalPages <= 7) pageNum = i + 1;
              else if (page <= 4) pageNum = i + 1;
              else if (page >= totalPages - 3) pageNum = totalPages - 6 + i;
              else pageNum = page - 3 + i;
              return (
                <motion.button
                  key={pageNum}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setPage(pageNum)}
                  className={`w-10 h-10 rounded-xl text-sm font-medium transition-colors ${
                    page === pageNum
                      ? 'bg-brand-500 text-white'
                      : 'border border-border text-text-secondary hover:bg-surface-tertiary'
                  }`}
                >
{toPersianNumber(pageNum)}
                </motion.button>
              );
            })}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="p-2 rounded-xl border border-border hover:bg-surface-tertiary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-text-secondary" />
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}

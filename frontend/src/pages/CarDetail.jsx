import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Phone, MessageCircle, Share2, Heart, MapPin, Clock, Fuel, Gauge, Calendar, Settings, CheckCircle, ChevronLeft, ChevronRight, Shield, Flag, User, Edit3, Eye, Trash2, RotateCcw, Sparkles, Star, Palette, Droplet, Settings2, Car, CircleDot, Wrench, Zap, FileText, ListChecks } from 'lucide-react';
import { getCar, deleteCar, restoreCar } from '../lib/carApi';
import {
  FUEL_LABELS, TRANSMISSION_LABELS, COLOR_LABELS, CITY_LABELS, BODY_LABELS,
  DETAILED_CONDITION_LABELS, CONDITION_LABELS, getConditionColor,
} from '../lib/constants';
import CarSpinner from '../components/CarSpinner';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice, toPersianNumber, formatTimeAgo } from '../utils/format';

const BACKEND_URL = 'http://localhost:8000';

function fixImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${BACKEND_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

const CONDITION_ICONS = {
  body_condition: Car,
  cabin_condition: User,
  motor_condition: Settings2,
  gearbox_condition: Settings,
  electrical_condition: Zap,
  front_suspension_condition: Wrench,
};

export default function CarDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [car, setCar] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showPhone, setShowPhone] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const { isLiked, toggleLike } = useFavorites();
  const { user } = useAuth();
  const liked = car ? isLiked(car.id) : false;

  const isOwner = car && user && car.seller?.id === user.id;
  const isDeleted = car ? car.is_active === false : false;

  // Guard against dev-mode StrictMode double-effects (dedupe in-flight
  // requests for the same id) and stale responses when the id changes.
  const inFlightRef = useRef(new Set());
  const latestIdRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const key = `car-${id}`;
    if (inFlightRef.current.has(key)) return;
    inFlightRef.current.add(key);
    latestIdRef.current = id;
    const includeDeleted = searchParams.get('deleted') === '1';
    getCar(id, { includeDeleted })
      .then((carData) => {
        if (latestIdRef.current !== id) return;
        setCar(carData);
        const urls = (carData.images || []).map((img) => fixImageUrl(img.image));
        setImages(urls);
      })
      .catch((err) => {
        if (latestIdRef.current !== id) return;
        if (err.response?.status === 404) {
          setError('آگهی یافت نشد.');
        } else if (err.response?.status === 403) {
          setError(err.response?.data?.detail || 'غير مجاز');
        } else {
          setError('خطا در دریافت اطلاعات آگهی.');
        }
      })
      .finally(() => {
        inFlightRef.current.delete(key);
        if (latestIdRef.current === id) setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 flex justify-center">
        <CarSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
        <p className="text-lg font-semibold text-red-500 mb-4">{error}</p>
        <Link to="/" className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-colors">بازگشت به خانه</Link>
      </div>
    );
  }

  if (!car) return null;

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  const memberYear = car.seller?.date_joined ? toPersianNumber(new Date(car.seller.date_joined).getFullYear()) : '';

  const handleDelete = async () => {
    if (!window.confirm('آیا از حذف این آگهی مطمئن هستید؟')) return;
    setActionLoading(true);
    try {
      await deleteCar(car.id);
      navigate('/my-listings');
    } catch (err) {
      alert('خطا در حذف آگهی. لطفاً دوباره تلاش کنید.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async () => {
    setActionLoading(true);
    try {
      await restoreCar(car.id);
      setCar({ ...car, is_active: true });
    } catch (err) {
      alert('خطا در بازیابی آگهی. لطفاً دوباره تلاش کنید.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 min-w-0">
          <div className="relative bg-surface-secondary rounded-2xl overflow-hidden mb-4">
            <div className="aspect-[16/10] sm:aspect-[16/9] relative">
              {images.length > 0 ? (
                <img
                  src={images[currentImageIndex]}
                  alt={car.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-text-tertiary">
                  <div className="text-center">
                    <User className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-sm">تصویری موجود نیست</p>
                  </div>
                </div>
              )}
              {images.length > 1 && (
                <>
                  <button onClick={prevImage} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-surface/90 hover:bg-surface rounded-full flex items-center justify-center shadow-lg transition-colors">
                    <ChevronRight className="w-5 h-5 text-text-primary" />
                  </button>
                  <button onClick={nextImage} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-surface/90 hover:bg-surface rounded-full flex items-center justify-center shadow-lg transition-colors">
                    <ChevronLeft className="w-5 h-5 text-text-primary" />
                  </button>
                </>
              )}
              {images.length > 0 && (
                <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-lg">
                  {toPersianNumber(currentImageIndex + 1)} / {toPersianNumber(images.length)}
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto scrollbar-hide">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImageIndex(i)}
                    className={`shrink-0 w-20 h-16 rounded-xl overflow-hidden border-2 transition-colors ${i === currentImageIndex ? 'border-brand-500' : 'border-transparent hover:border-border'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-surface rounded-2xl border border-border p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-text-primary leading-tight">{car.title}</h1>
                <div className="flex items-center gap-2 mt-2">
                  {car.brand && (
                    <span className="px-2 py-0.5 bg-brand-100 dark:bg-brand-900 text-brand-600 dark:text-brand-300 text-xs font-medium rounded-lg">
                      {car.brand}
                    </span>
                  )}
                  {car.model_name && (
                    <span className="px-2 py-0.5 bg-surface-tertiary text-text-secondary text-xs font-medium rounded-lg">
                      {car.model_name}
                    </span>
                  )}
                </div>
                <p className="text-text-tertiary text-sm mt-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> {CITY_LABELS[car.city] || car.city}
                  <span className="w-1 h-1 bg-text-tertiary rounded-full" />
                  <Clock className="w-4 h-4" /> {formatTimeAgo(car.created_at)}
                </p>
              </div>
              <div className="flex gap-2">
                {!isOwner && (
                  <button
                    onClick={(e) => toggleLike(car, e)}
                    className={`p-3 rounded-xl transition-colors ${liked ? 'text-red-500 bg-red-50 dark:bg-red-950' : 'text-text-secondary hover:bg-surface-tertiary'}`}
                  >
                    <Heart className={`w-5 h-5 ${liked ? 'fill-red-500' : ''}`} />
                  </button>
                )}
                <button className="p-3 text-text-secondary hover:bg-surface-tertiary rounded-xl transition-colors">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <p className="text-3xl font-bold text-brand-500 mb-6">{formatPrice(car.price)}</p>

            {/* Main Specs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {[
                  { icon: Calendar, label: 'سال تولید', value: toPersianNumber(car.year) },
                  { icon: Gauge, label: 'کارکرد', value: `${toPersianNumber(car.mileage?.toLocaleString('fa-IR'))} ک.م` },
                  { icon: Droplet, label: 'نوع سوخت', value: FUEL_LABELS[car.fuel_type] || car.fuel_type },
                  { icon: Settings2, label: 'نوع گیربکس', value: TRANSMISSION_LABELS[car.transmission] || car.transmission },
                ].map((item) => (
                  <div key={item.label} className="group flex min-h-[104px] flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-surface p-3 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-500/40 hover:shadow-lg">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 transition-colors group-hover:bg-brand-500/20">
                      <item.icon className="h-5 w-5 text-brand-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] leading-4 text-text-tertiary">{item.label}</p>
                      <p className="truncate text-sm font-bold leading-5 text-text-primary">{item.value}</p>
                    </div>
                  </div>
                ))}
            </div>

            {/* Appearance Specs */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { icon: Palette, label: 'رنگ بدنه', value: COLOR_LABELS[car.color] || car.color },
                  { icon: Car, label: 'نوع بدنه', value: BODY_LABELS[car.body_type] || car.body_type },
                ].map((item) => (
                  <div key={item.label} className="group flex min-h-[92px] items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-500/40 hover:shadow-lg">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 transition-colors group-hover:bg-brand-500/20">
                      <item.icon className="h-5 w-5 text-brand-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] leading-4 text-text-tertiary">{item.label}</p>
                      <p className="truncate text-sm font-bold leading-5 text-text-primary">{item.value}</p>
                    </div>
                  </div>
                ))}
            </div>

            {/* Technical Condition */}
            {car.detail_conditions && Object.values(car.detail_conditions).some(v => v) && (
              <div className="mb-4 rounded-2xl border border-border bg-surface p-5 shadow-sm">
                <h2 className="mb-5 flex items-center gap-2 text-base font-bold text-text-primary">
                  <CircleDot className="h-5 w-5 text-brand-500" />
                  وضعیت فنی خودرو
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {Object.entries(car.detail_conditions).map(([key, value]) => {
                    if (!value) return null;
                    const ConditionIcon = CONDITION_ICONS[key] || CircleDot;
                    return (
                      <div key={key} className="group flex min-h-[92px] items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-500/40 hover:shadow-lg">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 transition-colors group-hover:bg-brand-500/20">
                          <ConditionIcon className="h-5 w-5 text-brand-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] leading-4 text-text-tertiary">{DETAILED_CONDITION_LABELS[key] || key}</p>
                          <p className={`truncate text-sm font-bold leading-5 ${getConditionColor(value)}`}>{CONDITION_LABELS[value] || value}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mb-4 rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-text-primary">
                <FileText className="h-5 w-5 text-brand-500" />
                توضیحات
              </h2>
              <p className="text-text-secondary leading-relaxed">{car.description}</p>
            </div>

            {car.features && car.features.length > 0 && (
              <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
                <h2 className="mb-5 flex items-center gap-2 text-base font-bold text-text-primary">
                  <ListChecks className="h-5 w-5 text-brand-500" />
                  امکانات
                </h2>
                <div className="flex flex-wrap gap-2">
                  {car.features.map((feature) => (
                    <span key={feature} className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-tertiary text-text-secondary text-sm rounded-xl">
                      <CheckCircle className="w-3.5 h-3.5 text-accent-500" /> {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-surface rounded-2xl border border-border p-6 mb-6">
            <h2 className="text-lg font-bold text-text-primary mb-4">موقعیت مکانی</h2>
            <div className="bg-surface-secondary rounded-xl h-48 flex items-center justify-center text-text-tertiary">
              <div className="text-center">
                <MapPin className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">نقشه در اینجا نمایش داده می‌شود</p>
                <p className="text-xs">{CITY_LABELS[car.city] || car.city}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-text-tertiary text-sm mb-8">
            <Flag className="w-4 h-4" />
            <a href="#" className="hover:text-text-secondary">گزارش این آگهی</a>
          </div>
        </div>

        <div className="lg:w-80 shrink-0">
          <div className="bg-surface rounded-2xl border border-border p-6 sticky top-20">
            {isOwner && (
              <div className="mb-4 p-3 bg-green-100 dark:bg-green-950 border border-green-300 dark:border-green-800 rounded-xl">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400 text-sm font-medium">
                  <Sparkles className="w-4 h-4" />
                  این آگهی متعلق به شماست
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 mb-5 pb-5 border-b border-border">
              <div className="w-14 h-14 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center shrink-0">
                {car.seller?.avatar ? (
                  <img src={car.seller.avatar} alt={car.seller.name} className="w-full h-full object-cover rounded-full" />
                ) : (
                  <User className="w-6 h-6 text-brand-500" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-text-primary">{car.seller?.name || 'فروشنده'}</p>
                {memberYear && <p className="text-xs text-text-tertiary">عضو از {memberYear}</p>}
              </div>
            </div>

            {isOwner ? (
              <>
                <div className="space-y-3">
                  <Link
                    to={`/my-listings/${car.id}/edit`}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    ویرایش آگهی
                  </Link>
                </div>

                <div className="mt-5 pt-5 border-t border-border">
                  <div className="flex items-center gap-2 text-sm text-text-secondary mb-3">
                    <Eye className="w-4 h-4" />
                    آمار آگهی
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-surface-secondary rounded-lg py-2.5 px-3 text-center">
                      <p className="text-lg font-bold text-brand-500">{toPersianNumber(car.view_count || 0)}</p>
                      <p className="text-[10px] text-text-tertiary">بازدید</p>
                    </div>
                    <div className="bg-surface-secondary rounded-lg py-2.5 px-3 text-center">
                      <p className="text-lg font-bold text-red-500">{toPersianNumber(car.likes_count || 0)}</p>
                      <p className="text-[10px] text-text-tertiary">علاقه‌مندی</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border space-y-2">
                  <button className="flex items-center justify-center gap-2 w-full py-2.5 border-2 border-amber-500 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950 font-semibold rounded-xl transition-colors">
                    <Star className="w-4 h-4" />
                    ارتقا به آگهی ویژه
                  </button>
                  {isDeleted ? (
                    <button
                      onClick={handleRestore}
                      disabled={actionLoading}
                      className="flex items-center justify-center gap-2 w-full py-2.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
                    >
                      <RotateCcw className="w-4 h-4" />
                      {actionLoading ? 'در حال بازیابی...' : 'بازیابی آگهی'}
                    </button>
                  ) : (
                    <button
                      onClick={handleDelete}
                      disabled={actionLoading}
                      className="flex items-center justify-center gap-2 w-full py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      {actionLoading ? 'در حال حذف...' : 'حذف آگهی'}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="space-y-3">
                  <Link
                    to={`/chat?seller=${car.seller?.name || ''}&car=${car.title}`}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    گفتگو با فروشنده
                  </Link>

                  {showPhone ? (
                    <a
                      href={`tel:${car.seller?.phone || ''}`}
                      className="flex items-center justify-center gap-2 w-full py-3 bg-accent-500 hover:bg-accent-600 text-white font-semibold rounded-xl transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                      <span dir="ltr">{car.seller?.phone || ''}</span>
                    </a>
                  ) : (
                    <button
                      onClick={() => setShowPhone(true)}
                      className="flex items-center justify-center gap-2 w-full py-3 border-2 border-brand-500 text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950 font-semibold rounded-xl transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                      نمایش شماره تلفن
                    </button>
                  )}
                </div>

                <div className="mt-5 pt-5 border-t border-border">
                  <div className="flex items-center gap-2 text-sm text-text-secondary mb-3">
                    <Shield className="w-4 h-4 text-accent-500" />
                    نکات خرید امن
                  </div>
                  <ul className="space-y-2 text-xs text-text-tertiary">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-3 h-3 text-accent-500 mt-0.5 shrink-0" />
                      قبل از خرید خودرو را شخصاً بررسی کنید
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-3 h-3 text-accent-500 mt-0.5 shrink-0" />
                      از روش‌های پرداخت امن استفاده کنید
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-3 h-3 text-accent-500 mt-0.5 shrink-0" />
                      در مکان امن و عمومی ملاقات کنید
                    </li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Phone, MessageCircle, Share2, Heart, MapPin, Clock, Fuel, Gauge, Calendar, Settings, CheckCircle, ChevronLeft, ChevronRight, Shield, Flag, User } from 'lucide-react';

const MOCK_CAR = {
  id: 1,
  title: '۲۰۲۲ تسلا مدل ۳ لانگ رنج',
  price: '$۴۵,۰۰۰',
  description: 'وضعیت عالی، سرویس‌های دوره‌ای در نمایندگی تسلا. قابلیت رانندگی خودکار کامل. داخل سفید ممتاز با دکور چوب گردو. فقط ۱۲,۰۰۰ مایل. بدون تصادف، سند تمیز. گارانتی تا ۲۰۲۷.',
  year: 2022,
  mileage: '۱۲,۰۰۰ مایل',
  fuel: 'برقی',
  transmission: 'اتوماتیک',
  color: 'سفید',
  location: 'تهران، ایران',
  date: 'ثبت شده ۲ ساعت پیش',
  vin: '۵YJ۳E۱EA۷NF۱۲۳۴۵۶',
  condition: 'عالی',
  images: [
    'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1619767886558-efdc7b9af533?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1536700503339-0e4f1a5d8b8a?w=800&h=600&fit=crop',
  ],
  seller: {
    name: 'امیر ر.',
    phone: '+۹۸ ۹۱۲ ۳۴۵ ۶۷۸۹',
    memberSince: '۲۰۲۱',
    listingsCount: 5,
    avatar: null,
    verified: true,
  },
  features: ['سقف شیشه‌ای', 'صندلی چرم', 'ناوبری', 'بلوتوث', 'دوربین عقب', 'صندلی گرم‌شونده', 'ورود بدون کلید', 'مانیتور نقاط کور'],
};

export default function CarDetail() {
  const { id } = useParams();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showPhone, setShowPhone] = useState(false);

  const car = MOCK_CAR;

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % car.images.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + car.images.length) % car.images.length);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 min-w-0">
          <div className="relative bg-surface-secondary rounded-2xl overflow-hidden mb-4">
            <div className="aspect-[16/10] sm:aspect-[16/9] relative">
              <img
                src={car.images[currentImageIndex]}
                alt={car.title}
                className="w-full h-full object-cover"
              />
              {car.images.length > 1 && (
                <>
                  <button onClick={prevImage} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-surface/90 hover:bg-surface rounded-full flex items-center justify-center shadow-lg transition-colors">
                    <ChevronRight className="w-5 h-5 text-text-primary" />
                  </button>
                  <button onClick={nextImage} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-surface/90 hover:bg-surface rounded-full flex items-center justify-center shadow-lg transition-colors">
                    <ChevronLeft className="w-5 h-5 text-text-primary" />
                  </button>
                </>
              )}
              <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-lg">
                {currentImageIndex + 1} / {car.images.length}
              </div>
            </div>
            {car.images.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto scrollbar-hide">
                {car.images.map((img, i) => (
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
                <p className="text-text-tertiary text-sm mt-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> {car.location}
                  <span className="w-1 h-1 bg-text-tertiary rounded-full" />
                  <Clock className="w-4 h-4" /> {car.date}
                </p>
              </div>
              <div className="flex gap-2">
                <button className="p-3 text-text-secondary hover:bg-surface-tertiary rounded-xl transition-colors">
                  <Heart className="w-5 h-5" />
                </button>
                <button className="p-3 text-text-secondary hover:bg-surface-tertiary rounded-xl transition-colors">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <p className="text-3xl font-bold text-brand-500 mb-6">{car.price}</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-surface-secondary rounded-xl mb-6">
              {[
                { icon: Calendar, label: 'سال', value: car.year },
                { icon: Gauge, label: 'کارکرد', value: car.mileage },
                { icon: Fuel, label: 'سوخت', value: car.fuel },
                { icon: Settings, label: 'گیربکس', value: car.transmission },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <item.icon className="w-5 h-5 mx-auto text-brand-500 mb-1.5" />
                  <p className="text-xs text-text-tertiary">{item.label}</p>
                  <p className="font-semibold text-text-primary text-sm">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {[
                { label: 'وضعیت', value: car.condition },
                { label: 'رنگ', value: car.color },
                { label: 'VIN', value: car.vin },
              ].map((item) => (
                <div key={item.label} className="px-4 py-3 border border-border rounded-xl">
                  <p className="text-xs text-text-tertiary mb-0.5">{item.label}</p>
                  <p className="text-sm font-medium text-text-primary truncate">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-bold text-text-primary mb-3">توضیحات</h2>
              <p className="text-text-secondary leading-relaxed">{car.description}</p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-text-primary mb-3">امکانات</h2>
              <div className="flex flex-wrap gap-2">
                {car.features.map((feature) => (
                  <span key={feature} className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-tertiary text-text-secondary text-sm rounded-xl">
                    <CheckCircle className="w-3.5 h-3.5 text-accent-500" /> {feature}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-2xl border border-border p-6 mb-6">
            <h2 className="text-lg font-bold text-text-primary mb-4">موقعیت مکانی</h2>
            <div className="bg-surface-secondary rounded-xl h-48 flex items-center justify-center text-text-tertiary">
              <div className="text-center">
                <MapPin className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">نقشه در اینجا نمایش داده می‌شود</p>
                <p className="text-xs">{car.location}</p>
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
            <div className="flex items-center gap-3 mb-5 pb-5 border-b border-border">
              <div className="w-14 h-14 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center shrink-0">
                {car.seller.avatar ? (
                  <img src={car.seller.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-brand-500" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-text-primary">{car.seller.name}</p>
                  {car.seller.verified && <CheckCircle className="w-4 h-4 text-brand-500" />}
                </div>
                <p className="text-xs text-text-tertiary">{car.seller.listingsCount} آگهی</p>
              </div>
            </div>

            <div className="space-y-3">
              <Link
                to={`/chat?seller=${car.seller.name}&car=${car.title}`}
                className="flex items-center justify-center gap-2 w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                گفتگو با فروشنده
              </Link>

              {showPhone ? (
                <a
                  href={`tel:${car.seller.phone}`}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-accent-500 hover:bg-accent-600 text-white font-semibold rounded-xl transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  {car.seller.phone}
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
          </div>
        </div>
      </div>
    </div>
  );
}

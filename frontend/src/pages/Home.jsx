import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, SlidersHorizontal, Grid3X3, List, MessageCircle, Phone, MapPin, Clock, ChevronDown, X } from 'lucide-react';

const MOCK_CARS = [
  { id: 1, title: '۲۰۲۲ تسلا مدل ۳ لانگ رنج', price: '$۴۵,۰۰۰', year: 2022, mileage: '۱۲,۰۰۰ مایل', fuel: 'برقی', transmission: 'اتوماتیک', location: 'تهران', date: '۲ ساعت پیش', image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&h=300&fit=crop', color: 'سفید', featured: true },
  { id: 2, title: '۲۰۲۱ بامو X5 xDrive40i', price: '$۳۸,۵۰۰', year: 2021, mileage: '۲۵,۰۰۰ مایل', fuel: 'بنزینی', transmission: 'اتوماتیک', location: 'مشهد', date: '۵ ساعت پیش', image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=300&fit=crop', color: 'مشکی', featured: false },
  { id: 3, title: '۲۰۲۳ تویوتا کمری LE', price: '$۲۸,۰۰۰', year: 2023, mileage: '۸,۰۰۰ مایل', fuel: 'هیبرید', transmission: 'اتوماتیک', location: 'کرج', date: '۱ روز پیش', image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=300&fit=crop', color: 'نقره‌ای', featured: true },
  { id: 4, title: '۲۰۲۰ مرسدس بنز C300', price: '$۳۲,۰۰۰', year: 2020, mileage: '۳۲,۰۰۰ مایل', fuel: 'بنزینی', transmission: 'اتوماتیک', location: 'تهران', date: '۳ روز پیش', image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&h=300&fit=crop', color: 'خاکستری', featured: false },
  { id: 5, title: '۲۰۲۲ هیوندای النترا SEL', price: '$۲۲,۵۰۰', year: 2022, mileage: '۱۵,۰۰۰ مایل', fuel: 'بنزینی', transmission: 'اتوماتیک', location: 'اصفهان', date: '۶ ساعت پیش', image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&h=300&fit=crop', color: 'آبی', featured: false },
  { id: 6, title: '۲۰۲۱ نیسان آلتیما SR', price: '$۲۴,۸۰۰', year: 2021, mileage: '۲۸,۰۰۰ مایل', fuel: 'بنزینی', transmission: 'CVT', location: 'شیراز', date: '۲ روز پیش', image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&h=300&fit=crop', color: 'قرمز', featured: false },
  { id: 7, title: '۲۰۲۳ فورد ماستنگ GT', price: '$۵۲,۰۰۰', year: 2023, mileage: '۴,۰۰۰ مایل', fuel: 'بنزینی', transmission: 'دستی', location: 'تهران', date: '۱۲ ساعت پیش', image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop', color: 'زرد', featured: true },
  { id: 8, title: '۲۰۲۰ آئودی Q5 پریمیوم پلاس', price: '$۳۵,۰۰۰', year: 2020, mileage: '۳۰,۰۰۰ مایل', fuel: 'بنزینی', transmission: 'اتوماتیک', location: 'تبریز', date: '۴ روز پیش', image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=300&fit=crop', color: 'سفید', featured: false },
  { id: 9, title: '۲۰۲۲ کیا اسپورتیج EX', price: '$۲۷,۵۰۰', year: 2022, mileage: '۱۸,۰۰۰ مایل', fuel: 'بنزینی', transmission: 'اتوماتیک', location: 'رشت', date: '۱ روز پیش', image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&h=300&fit=crop', color: 'سبز', featured: false },
  { id: 10, title: '۲۰۲۱ شورلت تاهو LT', price: '$۵۵,۰۰۰', year: 2021, mileage: '۲۲,۰۰۰ مایل', fuel: 'بنزینی', transmission: 'اتوماتیک', location: 'اهواز', date: '۶ روز پیش', image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&h=300&fit=crop', color: 'مشکی', featured: false },
];

const brands = ['تسلا', 'بامو', 'تویوتا', 'مرسدس بنز', 'هیوندای', 'نیسان', 'فورد', 'آئودی', 'کیا', 'شورلت'];

export default function Home() {
  const [viewMode, setViewMode] = useState('grid');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isFilterActive = selectedBrand || priceRange.min || priceRange.max || searchQuery;

  const filteredCars = MOCK_CARS.filter((car) => {
    if (selectedBrand && !car.title.includes(selectedBrand)) return false;
    if (searchQuery && !car.title.includes(searchQuery) && !car.location.includes(searchQuery)) return false;
    if (priceRange.min && parseInt(car.price.replace(/[$,]/g, '')) < parseInt(priceRange.min)) return false;
    if (priceRange.max && parseInt(car.price.replace(/[$,]/g, '')) > parseInt(priceRange.max)) return false;
    return true;
  });

  return (
    <div>
      <section className="bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              خودروی ایده‌آلت را پیدا کن
            </h1>
            <p className="text-lg text-brand-200 mb-8">
              هزاران آگهی از فروشندگان معتبر در سراسر کشور را مرور کنید.
            </p>
            <div className="bg-white rounded-2xl p-2 shadow-lg flex flex-col sm:flex-row gap-2">
              <div className="flex-1 relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                <input
                  type="text"
                  placeholder="جستجو بر اساس برند، مدل یا مکان..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-12 pl-4 py-3.5 text-text-primary rounded-xl sm:rounded-none focus:outline-none"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>فیلترها</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {showFilters && (
        <div className="bg-white border-b border-border shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-text-primary">فیلترها</h3>
              <button onClick={() => setShowFilters(false)} className="text-text-tertiary hover:text-text-secondary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">برند</label>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-tertiary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                >
                  <option value="">همه برندها</option>
                  {brands.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">حداقل قیمت</label>
                <input
                  type="number"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                  placeholder="$۰"
                  className="w-full px-4 py-2.5 bg-surface-tertiary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">حداکثر قیمت</label>
                <input
                  type="number"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                  placeholder="$۱۰۰,۰۰۰"
                  className="w-full px-4 py-2.5 bg-surface-tertiary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => { setSelectedBrand(''); setPriceRange({ min: '', max: '' }); }}
                className="px-4 py-2 text-sm text-text-secondary border border-border rounded-xl hover:bg-surface-tertiary transition-colors"
              >
                پاک کردن همه
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            {isFilterActive ? (
              <h2 className="text-xl font-bold text-text-primary">
                {filteredCars.length > 0 ? `همه آگهی‌ها (${filteredCars.length})` : 'آگهی‌ای یافت نشد'}
              </h2>
            ) : (
              <h2 className="text-xl font-bold text-text-primary">همه آگهی‌ها</h2>
            )}
            <p className="text-sm text-text-tertiary mt-0.5">جدیدترین خودروهای اضافه شده توسط کاربران</p>
          </div>
          <div className="flex items-center gap-2 bg-surface-tertiary rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-brand-500' : 'text-text-tertiary hover:text-text-secondary'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-brand-500' : 'text-text-tertiary hover:text-text-secondary'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {filteredCars.length === 0 ? (
          <div className="text-center py-20">
            <Search className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-1">آگهی‌ای یافت نشد</h3>
            <p className="text-text-secondary">فیلترها یا عبارت جستجو را تغییر دهید.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredCars.map((car) => (
              <Link
                key={car.id}
                to={`/car/${car.id}`}
                className="group bg-white rounded-2xl border border-border overflow-hidden hover:shadow-lg hover:border-brand-500/30 transition-all duration-300"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-surface-tertiary">
                  <img
                    src={car.image}
                    alt={car.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {car.featured && (
                    <span className="absolute top-3 right-3 bg-brand-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                      ویژه
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-text-primary text-sm leading-snug mb-1 line-clamp-2 group-hover:text-brand-500 transition-colors">
                    {car.title}
                  </h3>
                  <p className="text-lg font-bold text-brand-500 mb-2">{car.price}</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className="px-2 py-0.5 bg-surface-tertiary text-text-secondary text-xs rounded-lg">{car.year}</span>
                    <span className="px-2 py-0.5 bg-surface-tertiary text-text-secondary text-xs rounded-lg">{car.mileage}</span>
                    <span className="px-2 py-0.5 bg-surface-tertiary text-text-secondary text-xs rounded-lg">{car.fuel}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-text-tertiary">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {car.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {car.date}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCars.map((car) => (
              <Link
                key={car.id}
                to={`/car/${car.id}`}
                className="group flex bg-white rounded-2xl border border-border overflow-hidden hover:shadow-lg hover:border-brand-500/30 transition-all duration-300"
              >
                <div className="w-48 shrink-0 relative overflow-hidden bg-surface-tertiary">
                  <img
                    src={car.image}
                    alt={car.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {car.featured && (
                    <span className="absolute top-2 right-2 bg-brand-500 text-white text-xs font-bold px-2 py-0.5 rounded-lg">ویژه</span>
                  )}
                </div>
                <div className="flex-1 p-5 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-text-primary group-hover:text-brand-500 transition-colors">{car.title}</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="px-2.5 py-1 bg-surface-tertiary text-text-secondary text-xs rounded-lg">{car.year}</span>
                      <span className="px-2.5 py-1 bg-surface-tertiary text-text-secondary text-xs rounded-lg">{car.mileage}</span>
                      <span className="px-2.5 py-1 bg-surface-tertiary text-text-secondary text-xs rounded-lg">{car.fuel}</span>
                      <span className="px-2.5 py-1 bg-surface-tertiary text-text-secondary text-xs rounded-lg">{car.transmission}</span>
                      <span className="px-2.5 py-1 bg-surface-tertiary text-text-secondary text-xs rounded-lg">{car.color}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div>
                      <p className="text-lg font-bold text-brand-500">{car.price}</p>
                      <div className="flex items-center gap-3 text-xs text-text-tertiary mt-0.5">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {car.location}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {car.date}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

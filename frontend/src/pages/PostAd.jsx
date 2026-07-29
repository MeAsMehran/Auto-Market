import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, ChevronRight, Loader2, Car, CheckCircle, AlertCircle } from 'lucide-react';
import { createCar, uploadCarImages } from '../lib/carApi';
import {
  BRANDS, FUEL_MAP, TRANSMISSION_MAP, CONDITION_MAP, BODY_MAP, COLOR_MAP, CITY_MAP,
} from '../lib/constants';

const FUEL_OPTIONS = Object.keys(FUEL_MAP);
const TRANSMISSION_OPTIONS = Object.keys(TRANSMISSION_MAP);
const CONDITION_OPTIONS = Object.keys(CONDITION_MAP);
const BODY_OPTIONS = Object.keys(BODY_MAP);
const COLOR_OPTIONS = Object.keys(COLOR_MAP);
const CITY_OPTIONS = Object.keys(CITY_MAP);

export default function PostAd() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [images, setImages] = useState([]);
  const [form, setForm] = useState({
    brand: '', model_name: '', year: '', price: '', mileage: '',
    fuel_type: '', transmission: '', condition: '', body_type: '',
    color: '', city: '', title: '', description: '', features: '',
  });

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map((f) => ({ file: f, url: URL.createObjectURL(f) }));
    setImages((prev) => [...prev, ...newImages].slice(0, 10));
  };

  const removeImage = (index) => setImages((prev) => prev.filter((_, i) => i !== index));
  const updateForm = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const carData = {
        title: form.title,
        brand: form.brand,
        model_name: form.model_name,
        year: parseInt(form.year, 10),
        price: parseInt(form.price, 10),
        mileage: parseInt(form.mileage, 10),
        fuel_type: FUEL_MAP[form.fuel_type],
        transmission: TRANSMISSION_MAP[form.transmission],
        body_type: BODY_MAP[form.body_type],
        condition: CONDITION_MAP[form.condition],
        color: COLOR_MAP[form.color],
        city: CITY_MAP[form.city],
        description: form.description,
        features: form.features
          ? form.features.split(',').map((f) => f.trim()).filter(Boolean)
          : [],
      };

      const newCar = await createCar(carData);

      if (images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const formData = new FormData();
          formData.append('image', images[i].file);
          formData.append('order', i);
          await uploadCarImages(newCar.id, formData);
        }
      }

      navigate('/my-listings');
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        const messages = Object.entries(data)
          .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
          .join('\n');
        setError(messages);
      } else {
        setError('خطایی رخ داد. لطفاً دوباره تلاش کنید.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-2 mb-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step >= s ? 'bg-brand-500 text-white' : 'bg-surface-tertiary text-text-tertiary'}`}>
              {s}
            </div>
            {s < 3 && <div className={`w-12 h-0.5 transition-colors ${step > s ? 'bg-brand-500' : 'bg-border'}`} />}
          </div>
        ))}
      </div>
      <h1 className="text-2xl font-bold text-text-primary mb-1">فروش خودرو</h1>
      <p className="text-text-secondary mb-8">آگهی خود را به صورت رایگان ثبت کنید و به هزاران خریدار دسترسی پیدا کنید.</p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300 whitespace-pre-line">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <div className="bg-surface rounded-2xl border border-border p-6 space-y-5">
            <h2 className="text-lg font-bold text-text-primary">اطلاعات اولیه</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">برند *</label>
                <select value={form.brand} onChange={(e) => updateForm('brand', e.target.value)} className="w-full px-4 py-3 bg-surface-tertiary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" required>
                  <option value="">انتخاب برند</option>
                  {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">مدل *</label>
                <input type="text" value={form.model_name} onChange={(e) => updateForm('model_name', e.target.value)} placeholder="مثال: مدل ۳، X۵، کمری" className="w-full px-4 py-3 bg-surface-tertiary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">سال ساخت *</label>
                <select value={form.year} onChange={(e) => updateForm('year', e.target.value)} className="w-full px-4 py-3 bg-surface-tertiary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" required>
                  <option value="">انتخاب سال</option>
                  {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">قیمت (تومان) *</label>
                <input type="number" value={form.price} onChange={(e) => updateForm('price', e.target.value)} placeholder="مثال: ۱۵۰۰۰۰۰۰۰" className="w-full px-4 py-3 bg-surface-tertiary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">کارکرد (کیلومتر) *</label>
                <input type="number" value={form.mileage} onChange={(e) => updateForm('mileage', e.target.value)} placeholder="مثال: ۱۲۰۰۰" className="w-full px-4 py-3 bg-surface-tertiary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">نوع بدنه *</label>
                <select value={form.body_type} onChange={(e) => updateForm('body_type', e.target.value)} className="w-full px-4 py-3 bg-surface-tertiary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" required>
                  <option value="">انتخاب نوع بدنه</option>
                  {BODY_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">نوع سوخت *</label>
                <select value={form.fuel_type} onChange={(e) => updateForm('fuel_type', e.target.value)} className="w-full px-4 py-3 bg-surface-tertiary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" required>
                  <option value="">انتخاب سوخت</option>
                  {FUEL_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">گیربکس *</label>
                <select value={form.transmission} onChange={(e) => updateForm('transmission', e.target.value)} className="w-full px-4 py-3 bg-surface-tertiary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" required>
                  <option value="">انتخاب گیربکس</option>
                  {TRANSMISSION_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">وضعیت *</label>
                <select value={form.condition} onChange={(e) => updateForm('condition', e.target.value)} className="w-full px-4 py-3 bg-surface-tertiary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" required>
                  <option value="">انتخاب وضعیت</option>
                  {CONDITION_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="flex justify-start">
              <button type="button" onClick={() => setStep(2)} className="flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-colors">
                بعدی <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-surface rounded-2xl border border-border p-6 space-y-5">
            <h2 className="text-lg font-bold text-text-primary">عکس‌ها و توضیحات</h2>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">آپلود عکس (حداکثر ۱۰ عدد)</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {images.map((img, i) => (
                  <div key={i} className="relative aspect-square bg-surface-tertiary rounded-xl overflow-hidden border border-border">
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeImage(i)} className="absolute top-1 left-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {images.length < 10 && (
                  <label className="aspect-square bg-surface-tertiary border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950 transition-colors">
                    <Upload className="w-6 h-6 text-text-tertiary mb-1" />
                    <span className="text-xs text-text-tertiary">آپلود</span>
                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                  </label>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">عنوان آگهی *</label>
              <input type="text" value={form.title} onChange={(e) => updateForm('title', e.target.value)} placeholder="مثال: ۲۰۲۲ تسلا مدل ۳ لانگ رنج" className="w-full px-4 py-3 bg-surface-tertiary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">توضیحات *</label>
              <textarea
                value={form.description}
                onChange={(e) => updateForm('description', e.target.value)}
                placeholder="وضعیت خودرو، امکانات، سابقه سرویس و سایر جزئیات را توضیح دهید..."
                rows={5}
                className="w-full px-4 py-3 bg-surface-tertiary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">امکانات (اختیاری)</label>
              <input type="text" value={form.features} onChange={(e) => updateForm('features', e.target.value)} placeholder="مثال: سقف شیشه‌ای, صندلی چرم, ناوبری" className="w-full px-4 py-3 bg-surface-tertiary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
              <p className="text-xs text-text-tertiary mt-1">با کاما جدا کنید</p>
            </div>
            <div className="flex justify-between">
              <button type="button" onClick={() => setStep(1)} className="px-6 py-3 text-text-secondary border border-border hover:bg-surface-tertiary font-semibold rounded-xl transition-colors">قبلی</button>
              <button type="button" onClick={() => setStep(3)} className="flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-colors">
                بعدی <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-surface rounded-2xl border border-border p-6 space-y-5">
            <h2 className="text-lg font-bold text-text-primary">مکان و رنگ</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">شهر *</label>
                <select value={form.city} onChange={(e) => updateForm('city', e.target.value)} className="w-full px-4 py-3 bg-surface-tertiary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" required>
                  <option value="">انتخاب شهر</option>
                  {CITY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">رنگ *</label>
                <select value={form.color} onChange={(e) => updateForm('color', e.target.value)} className="w-full px-4 py-3 bg-surface-tertiary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" required>
                  <option value="">انتخاب رنگ</option>
                  {COLOR_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="bg-accent-50 dark:bg-accent-950 border border-accent-200 dark:border-accent-800 rounded-xl p-4 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-accent-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-accent-700 dark:text-accent-300">نزدیک به اتمام!</p>
                <p className="text-xs text-accent-600 dark:text-accent-400 mt-0.5">آگهی خود را بررسی کرده و ثبت کنید. بعداً می‌توانید از پیشخوان آن را ویرایش کنید.</p>
              </div>
            </div>

            <div className="flex justify-between">
              <button type="button" onClick={() => setStep(2)} className="px-6 py-3 text-text-secondary border border-border hover:bg-surface-tertiary font-semibold rounded-xl transition-colors">قبلی</button>
              <button type="submit" disabled={loading} className="flex items-center gap-2 px-8 py-3 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white font-semibold rounded-xl transition-colors">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Car className="w-4 h-4" />}
                {loading ? 'در حال انتشار...' : 'انتشار آگهی'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

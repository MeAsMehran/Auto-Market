import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, ChevronRight, Loader2, Car, CheckCircle } from 'lucide-react';

const BRANDS = ['تسلا', 'بامو', 'تویوتا', 'مرسدس بنز', 'هیوندای', 'نیسان', 'فورد', 'آئودی', 'کیا', 'شورلت', 'هوندا', 'مزدا', 'فولکس‌واگن', 'پورشه', 'لکسوس'];
const FUEL_TYPES = ['بنزینی', 'دیزلی', 'هیبرید', 'برقی', 'پلاگین هیبرید'];
const TRANSMISSIONS = ['اتوماتیک', 'دستی', 'CVT', 'نیمه اتوماتیک'];
const CONDITIONS = ['نو', 'عالی', 'خوب', 'مناسب', 'نیاز به تعمیر'];
const COLORS = ['سفید', 'مشکی', 'نقره‌ای', 'خاکستری', 'آبی', 'قرمز', 'سبز', 'زرد', 'قهوه‌ای', 'نارنجی', 'سایر'];

export default function PostAd() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [form, setForm] = useState({
    brand: '', model: '', year: '', price: '', mileage: '', fuel: '',
    transmission: '', condition: '', color: '', location: '', phone: '',
    title: '', description: '', vin: '',
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
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    navigate('/my-listings');
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
                <input type="text" value={form.model} onChange={(e) => updateForm('model', e.target.value)} placeholder="مثال: مدل ۳، X۵، کمری" className="w-full px-4 py-3 bg-surface-tertiary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" required />
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
                <label className="block text-sm font-medium text-text-primary mb-1.5">قیمت ($) *</label>
                <input type="number" value={form.price} onChange={(e) => updateForm('price', e.target.value)} placeholder="مثال: ۴۵۰۰۰" className="w-full px-4 py-3 bg-surface-tertiary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">کارکرد *</label>
                <input type="text" value={form.mileage} onChange={(e) => updateForm('mileage', e.target.value)} placeholder="مثال: ۱۲۰۰۰ مایل یا ۲۰۰۰۰ کیلومتر" className="w-full px-4 py-3 bg-surface-tertiary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">VIN (اختیاری)</label>
                <input type="text" value={form.vin} onChange={(e) => updateForm('vin', e.target.value)} placeholder="کد ۱۷ رقمی VIN" className="w-full px-4 py-3 bg-surface-tertiary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">نوع سوخت *</label>
                <select value={form.fuel} onChange={(e) => updateForm('fuel', e.target.value)} className="w-full px-4 py-3 bg-surface-tertiary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" required>
                  <option value="">انتخاب سوخت</option>
                  {FUEL_TYPES.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">گیربکس *</label>
                <select value={form.transmission} onChange={(e) => updateForm('transmission', e.target.value)} className="w-full px-4 py-3 bg-surface-tertiary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" required>
                  <option value="">انتخاب گیربکس</option>
                  {TRANSMISSIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">وضعیت *</label>
                <select value={form.condition} onChange={(e) => updateForm('condition', e.target.value)} className="w-full px-4 py-3 bg-surface-tertiary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" required>
                  <option value="">انتخاب وضعیت</option>
                  {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
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
            <h2 className="text-lg font-bold text-text-primary">اطلاعات تماس و مکان</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">مکان *</label>
                <input type="text" value={form.location} onChange={(e) => updateForm('location', e.target.value)} placeholder="شهر، منطقه" className="w-full px-4 py-3 bg-surface-tertiary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">شماره تلفن *</label>
                <input type="tel" value={form.phone} onChange={(e) => updateForm('phone', e.target.value)} placeholder="+۹۸ ۹۱۲ ۳۴۵ ۶۷۸۹" className="w-full px-4 py-3 bg-surface-tertiary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">رنگ</label>
                <select value={form.color} onChange={(e) => updateForm('color', e.target.value)} className="w-full px-4 py-3 bg-surface-tertiary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20">
                  <option value="">انتخاب رنگ</option>
                  {COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
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

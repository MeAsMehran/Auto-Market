import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Upload, X, ChevronLeft, Loader2, Car, CheckCircle, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { getCar, getCarImages, updateCar, uploadCarImages, deleteCarImage } from '../lib/carApi';
import {
  BRANDS, FUEL_MAP, TRANSMISSION_MAP, CONDITION_MAP, BODY_MAP, COLOR_MAP, CITY_MAP,
  FUEL_LABELS, TRANSMISSION_LABELS, CONDITION_LABELS, BODY_LABELS, COLOR_LABELS, CITY_LABELS,
} from '../lib/constants';
import { fixImageUrl } from '../components/CarCard';

const FUEL_OPTIONS = Object.keys(FUEL_MAP);
const TRANSMISSION_OPTIONS = Object.keys(TRANSMISSION_MAP);
const CONDITION_OPTIONS = Object.keys(CONDITION_MAP);
const BODY_OPTIONS = Object.keys(BODY_MAP);
const COLOR_OPTIONS = Object.keys(COLOR_MAP);
const CITY_OPTIONS = Object.keys(CITY_MAP);

const SLOT_CONFIG = [
  { key: 'front',  label: 'جلو',      desc: 'نمای جلوی خودرو',  order: 0 },
  { key: 'rear',   label: 'عقب',      desc: 'نمای عقب خودرو',    order: 1 },
  { key: 'left',   label: 'سمت چپ',   desc: 'نمای سمت چپ خودرو', order: 2 },
  { key: 'right',  label: 'سمت راست', desc: 'نمای سمت راست خودرو', order: 3 },
  { key: 'other',  label: 'سایر',     desc: 'تصویر دیگر',        order: 4 },
];

export default function EditAd() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    brand: '', model_name: '', year: '', price: '', mileage: '',
    fuel_type: '', transmission: '', condition: '', body_type: '',
    color: '', city: '', title: '', description: '',
  });
  const [features, setFeatures] = useState([]);
  const [featureInput, setFeatureInput] = useState('');
  const [stepErrors, setStepErrors] = useState({});

  const [existingImages, setExistingImages] = useState([]);
  const [removedImageIds, setRemovedImageIds] = useState([]);
  const [newSlots, setNewSlots] = useState({
    front: null, rear: null, left: null, right: null, other: null,
  });

  useEffect(() => {
    fetchCar();
  }, [id]);

  const fetchCar = async () => {
    setLoading(true);
    try {
      const [car, images] = await Promise.all([getCar(id), getCarImages(id)]);
      setForm({
        brand: car.brand || '',
        model_name: car.model_name || '',
        year: car.year || '',
        price: car.price || '',
        mileage: car.mileage || '',
        fuel_type: FUEL_LABELS[car.fuel_type] || '',
        transmission: TRANSMISSION_LABELS[car.transmission] || '',
        condition: CONDITION_LABELS[car.condition] || '',
        body_type: BODY_LABELS[car.body_type] || '',
        color: COLOR_LABELS[car.color] || '',
        city: CITY_LABELS[car.city] || '',
        title: car.title || '',
        description: car.description || '',
      });
      setFeatures(car.features || []);
      setExistingImages(Array.isArray(images) ? images : images.results || []);
    } catch {
      setError('خطا در بارگذاری اطلاعات آگهی.');
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const addFeature = () => {
    const trimmed = featureInput.trim();
    if (trimmed && !features.includes(trimmed)) {
      setFeatures([...features, trimmed]);
      setFeatureInput('');
    }
  };
  const removeFeature = (index) => setFeatures((prev) => prev.filter((_, i) => i !== index));
  const handleFeatureKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addFeature(); }
  };

  const validateStep1 = () => {
    const missing = [];
    if (!form.brand) missing.push('برند');
    if (!form.model_name) missing.push('مدل');
    if (!form.year) missing.push('سال ساخت');
    if (!form.price || parseInt(form.price, 10) <= 0) missing.push('قیمت');
    if (!form.mileage || parseInt(form.mileage, 10) < 0) missing.push('کارکرد');
    if (!form.body_type) missing.push('نوع بدنه');
    if (!form.fuel_type) missing.push('نوع سوخت');
    if (!form.transmission) missing.push('گیربکس');
    if (!form.condition) missing.push('وضعیت');
    return missing.length ? `لطفاً این فیلدها را پر کنید: ${missing.join('، ')}` : null;
  };
  const validateStep2 = () => {
    const missing = [];
    if (!form.title) missing.push('عنوان آگهی');
    if (!form.description) missing.push('توضیحات');
    else if (form.description.trim().length < 10) missing.push('توضیحات (حداقل ۱۰ کاراکتر)');
    return missing.length ? `لطفاً این فیلدها را پر کنید: ${missing.join('، ')}` : null;
  };
  const validateStep3 = () => {
    const missing = [];
    if (!form.city) missing.push('شهر');
    if (!form.color) missing.push('رنگ');
    return missing.length ? `لطفاً این فیلدها را پر کنید: ${missing.join('، ')}` : null;
  };

  const goToStep2 = () => {
    const err = validateStep1();
    if (err) { setError(err); return; }
    setError(null);
    setStep(2);
  };
  const goToStep3 = () => {
    const err = validateStep2();
    if (err) { setError(err); return; }
    setError(null);
    setStep(3);
  };

  const handleNewSlotUpload = (slotKey, file) => {
    if (!file) return;
    setNewSlots((prev) => ({ ...prev, [slotKey]: { file, url: URL.createObjectURL(file) } }));
  };
  const removeNewSlot = (slotKey) => setNewSlots((prev) => ({ ...prev, [slotKey]: null }));

  const handleRemoveExistingImage = (imageId) => {
    setRemovedImageIds((prev) => [...prev, imageId]);
  };
  const handleUndoRemoveImage = (imageId) => {
    setRemovedImageIds((prev) => prev.filter((x) => x !== imageId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validateStep3();
    const fieldErrors = {};
    if (!form.city) fieldErrors.city = 'لطفاً شهر را انتخاب کنید.';
    if (!form.color) fieldErrors.color = 'لطفاً رنگ را انتخاب کنید.';
    if (err) {
      setStepErrors(fieldErrors);
      setError(err);
      return;
    }
    setStepErrors({});
    setError(null);
    setSaving(true);

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
        features,
      };

      await updateCar(id, carData);

      for (const imageId of removedImageIds) {
        await deleteCarImage(id, imageId);
      }

      for (const slot of SLOT_CONFIG) {
        const imageData = newSlots[slot.key];
        if (imageData) {
          const formData = new FormData();
          formData.append('image', imageData.file);
          formData.append('order', slot.order);
          await uploadCarImages(id, formData);
        }
      }

      sessionStorage.removeItem('myListings');
      navigate('/my-listings');
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        const fieldLabels = {
          title: 'عنوان', brand: 'برند', model_name: 'مدل', year: 'سال ساخت',
          price: 'قیمت', mileage: 'کارکرد', fuel_type: 'نوع سوخت', transmission: 'گیربکس',
          body_type: 'نوع بدنه', condition: 'وضعیت', color: 'رنگ', city: 'شهر',
          description: 'توضیحات', features: 'امکانات', detail: 'جزئیات',
          non_field_errors: 'خطا',
        };
        const lines = Object.entries(data)
          .map(([field, msgs]) => {
            const label = fieldLabels[field] || field;
            const msg = Array.isArray(msgs) ? msgs.join('، ') : msgs;
            return `${label}: ${msg}`;
          });
        setError(lines.length > 0 ? lines.join('\n') : 'لطفاً تمام فیلدهای الزامی را پر کنید.');
      } else {
        setError('خطایی رخ داد. لطفاً دوباره تلاش کنید.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-3" />
        <p className="text-text-secondary text-sm">در حال بارگذاری اطلاعات...</p>
      </div>
    );
  }

  const activeExisting = existingImages.filter((img) => !removedImageIds.includes(img.id));

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
      <h1 className="text-2xl font-bold text-text-primary mb-1">ویرایش آگهی</h1>
      <p className="text-text-secondary mb-8">اطلاعات آگهی خودروی خود را ویرایش کنید.</p>

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
                <input type="text" value={form.model_name} onChange={(e) => updateForm('model_name', e.target.value)} className="w-full px-4 py-3 bg-surface-tertiary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" required />
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
                <input type="number" value={form.price} onChange={(e) => updateForm('price', e.target.value)} className="w-full px-4 py-3 bg-surface-tertiary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">کارکرد (کیلومتر) *</label>
                <input type="number" value={form.mileage} onChange={(e) => updateForm('mileage', e.target.value)} className="w-full px-4 py-3 bg-surface-tertiary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" required />
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
              <button type="button" onClick={goToStep2} className="flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-colors">
                بعدی <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-surface rounded-2xl border border-border p-6 space-y-5">
            <h2 className="text-lg font-bold text-text-primary">عکس‌ها و توضیحات</h2>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">تصاویر فعلی</label>
              {activeExisting.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                  {activeExisting.map((img) => (
                    <div key={img.id} className="relative aspect-[4/3] bg-surface-tertiary rounded-xl overflow-hidden border border-border group">
                      <img src={fixImageUrl(img.image)} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingImage(img.id)}
                        className="absolute top-1.5 left-1.5 w-7 h-7 bg-red-500/80 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-text-tertiary mb-4">تصویری موجود نیست.</p>
              )}
              {removedImageIds.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-red-500 mb-2">{removedImageIds.length} تصویر برای حذف انتخاب شد.</p>
                  <div className="flex flex-wrap gap-2">
                    {existingImages.filter((img) => removedImageIds.includes(img.id)).map((img) => (
                      <button key={img.id} type="button" onClick={() => handleUndoRemoveImage(img.id)} className="px-2 py-1 text-xs bg-red-50 dark:bg-red-950 text-red-600 rounded-lg border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900 transition-colors">
                        بازگردانی
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">افزودن تصویر جدید</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {SLOT_CONFIG.map((slot) => {
                  const imageData = newSlots[slot.key];
                  return (
                    <div key={slot.key} className="flex flex-col gap-1.5">
                      {imageData ? (
                        <div className="relative aspect-[4/3] bg-surface-tertiary rounded-xl overflow-hidden border border-border">
                          <img src={imageData.url} alt={slot.label} className="w-full h-full object-cover" />
                          <button type="button" onClick={() => removeNewSlot(slot.key)} className="absolute top-1.5 left-1.5 w-7 h-7 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <label className="aspect-[4/3] bg-surface-tertiary border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950 transition-colors">
                          <Upload className="w-6 h-6 text-text-tertiary mb-1.5" />
                          <span className="text-xs font-medium text-text-secondary">{slot.label}</span>
                          <input type="file" accept="image/*" onChange={(e) => handleNewSlotUpload(slot.key, e.target.files?.[0])} className="hidden" />
                        </label>
                      )}
                      <p className="text-[11px] text-text-tertiary text-center leading-tight">{slot.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">عنوان آگهی *</label>
              <input type="text" value={form.title} onChange={(e) => updateForm('title', e.target.value)} className="w-full px-4 py-3 bg-surface-tertiary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">توضیحات *</label>
              <textarea value={form.description} onChange={(e) => updateForm('description', e.target.value)} rows={5} className="w-full px-4 py-3 bg-surface-tertiary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">امکانات (اختیاری)</label>
              <div className="flex gap-2">
                <input type="text" value={featureInput} onChange={(e) => setFeatureInput(e.target.value)} onKeyDown={handleFeatureKeyDown} placeholder="مثال: سقف شیشه‌ای، صندلی چرم" className="flex-1 px-4 py-3 bg-surface-tertiary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
                <button type="button" onClick={addFeature} className="px-4 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl transition-colors flex items-center gap-1 shrink-0">
                  <Plus className="w-4 h-4" /><span className="text-sm font-medium">افزودن</span>
                </button>
              </div>
              {features.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {features.map((feature, i) => (
                    <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 text-sm rounded-xl border border-brand-200 dark:border-brand-800">
                      {feature}
                      <button type="button" onClick={() => removeFeature(i)} className="hover:text-red-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-between">
              <button type="button" onClick={() => setStep(1)} className="px-6 py-3 text-text-secondary border border-border hover:bg-surface-tertiary font-semibold rounded-xl transition-colors">قبلی</button>
              <button type="button" onClick={goToStep3} className="flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-colors">
                بعدی <ChevronLeft className="w-4 h-4" />
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
                <select value={form.city} onChange={(e) => { updateForm('city', e.target.value); setStepErrors((p) => ({ ...p, city: undefined })); }} className={`w-full px-4 py-3 bg-surface-tertiary border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${stepErrors.city ? 'border-red-500' : 'border-border'}`} required>
                  <option value="">انتخاب شهر</option>
                  {CITY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                {stepErrors.city && <p className="text-xs text-red-500 mt-1">{stepErrors.city}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">رنگ *</label>
                <select value={form.color} onChange={(e) => { updateForm('color', e.target.value); setStepErrors((p) => ({ ...p, color: undefined })); }} className={`w-full px-4 py-3 bg-surface-tertiary border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${stepErrors.color ? 'border-red-500' : 'border-border'}`} required>
                  <option value="">انتخاب رنگ</option>
                  {COLOR_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                {stepErrors.color && <p className="text-xs text-red-500 mt-1">{stepErrors.color}</p>}
              </div>
            </div>
            <div className="bg-accent-50 dark:bg-accent-950 border border-accent-200 dark:border-accent-800 rounded-xl p-4 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-accent-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-300">آماده ذخیره!</p>
                <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">تغییرات خود را بررسی کرده و ذخیره کنید.</p>
              </div>
            </div>
            <div className="flex justify-between">
              <button type="button" onClick={() => setStep(2)} className="px-6 py-3 text-text-secondary border border-border hover:bg-surface-tertiary font-semibold rounded-xl transition-colors">قبلی</button>
              <button type="submit" disabled={saving} className="flex items-center gap-2 px-8 py-3 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white font-semibold rounded-xl transition-colors">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Car className="w-4 h-4" />}
                {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

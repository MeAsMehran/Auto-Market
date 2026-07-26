import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Car, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);

  const clearError = (field) => {
    setErrors(prev => ({ ...prev, [field]: '' }));
    if (generalError) setGeneralError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setGeneralError('');
    setLoading(true);

    const safetyTimer = setTimeout(() => {
      setLoading(false);
      setGeneralError('Request timed out. Please try again.');
    }, 10000);

    try {
      await login(phone, password);
      clearTimeout(safetyTimer);
      navigate('/');
    } catch (err) {
      clearTimeout(safetyTimer);
      if (err.response?.data) {
        const data = err.response.data;
        const status = err.response.status;

        if (status === 401 || status === 403) {
          setGeneralError(data.detail || 'اطلاعات وارد شده صحیح نیست. لطفاً دوباره تلاش کنید.');
        } else if (status === 400) {
          setErrors({
            phone: data.phone?.[0] || '',
            password: data.password?.[0] || '',
          });
          if (data.non_field_errors) setGeneralError(data.non_field_errors[0]);
          else if (data.detail) setGeneralError(data.detail);
        } else if (status === 500 && data.detail) {
          const detail = data.detail;
          if (detail.includes('phone') || detail.includes('format') || detail.includes('Invalid')) {
            setErrors({ phone: 'فرمت شماره تلفن نامعتبر است. مثال: ۰۹۱۲۳۴۵۶۷۸۹' });
          } else setGeneralError(detail);
        } else if (data.detail) {
          setGeneralError(data.detail);
        } else {
          setGeneralError('خطای سرور. لطفاً دوباره تلاش کنید.');
        }
      } else if (err.request) {
        setGeneralError('خطای شبکه. سرور در دسترس نیست.');
      } else {
        setGeneralError('خطای ناشناخته. لطفاً دوباره تلاش کنید.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative text-white max-w-md">
          <Car className="w-16 h-16 mb-6 text-brand-200" />
          <h1 className="text-4xl font-bold mb-4">خوش برگشتی به آتو مارکت</h1>
          <p className="text-lg text-brand-200 leading-relaxed">
            هزاران آگهی خودرو را مرور کن، با فروشندگان ارتباط برقرار کن و خودروی ایده‌آلت را پیدا کن.
          </p>
          <div className="mt-8 flex gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-4">
              <p className="text-2xl font-bold">۱۰K+</p>
              <p className="text-sm text-brand-200">آگهی فعال</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-4">
              <p className="text-2xl font-bold">۵۰K+</p>
              <p className="text-sm text-brand-200">کاربران راضی</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2 mb-8 justify-center lg:justify-start">
            <Car className="w-7 h-7 text-brand-500" />
            <span className="text-xl font-bold text-brand-700">آتو مارکت</span>
          </Link>

          <h2 className="text-2xl font-bold text-text-primary mb-1">ورود</h2>
          <p className="text-text-secondary mb-8">خوش برگشتی! لطفاً اطلاعات خود را وارد کنید.</p>

          {generalError && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm mb-6 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {generalError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">شماره تلفن</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); clearError('phone'); }}
                placeholder="۰۹۱۲ ۳۴۵ ۶۷۸۹"
                className={`w-full px-4 py-3 bg-surface-tertiary border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors ${
                  errors.phone ? 'border-red-400 dark:border-red-500 focus:border-red-500' : 'border-border focus:border-brand-500'
                }`}
                required
              />
              {errors.phone && (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.phone}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">رمز عبور</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearError('password'); }}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 pl-11 bg-surface-tertiary border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors ${
                    errors.password ? 'border-red-400 dark:border-red-500 focus:border-red-500' : 'border-border focus:border-brand-500'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.password}
                </p>
              )}
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-text-secondary cursor-pointer">
                <input type="checkbox" className="rounded border-border text-brand-500 focus:ring-brand-500" />
                مرا به خاطر بسپار
              </label>
              <a href="#" className="text-brand-500 hover:text-brand-600 font-medium">رمز عبور را فراموش کرده‌اید؟</a>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'در حال ورود...' : 'ورود'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-text-secondary">
            حساب کاربری ندارید؟{' '}
            <Link to="/register" className="text-brand-500 hover:text-brand-600 font-medium">ثبت‌نام</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

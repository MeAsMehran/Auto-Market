import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Car, Eye, EyeOff, Loader2, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStep1 = (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('رمز عبور و تکرار آن مطابقت ندارند');
      return;
    }
    if (password.length < 8) {
      setError('رمز عبور باید حداقل ۸ کاراکتر باشد');
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({ name, phone, password });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.detail || 'ثبت‌نام انجام نشد. لطفاً دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2 mb-8 justify-center lg:justify-start">
            <Car className="w-7 h-7 text-brand-500" />
            <span className="text-xl font-bold text-brand-700">آتو مارکت</span>
          </Link>

          <div className="flex items-center gap-2 mb-1">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step >= s ? 'bg-brand-500 text-white' : 'bg-surface-tertiary text-text-tertiary'}`}>
                  {s}
                </div>
                {s < 2 && <div className={`w-12 h-0.5 transition-colors ${step > s ? 'bg-brand-500' : 'bg-border'}`} />}
              </div>
            ))}
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-1">
            {step === 1 ? 'ایجاد حساب' : 'تایید'}
          </h2>
          <p className="text-text-secondary mb-8">
            {step === 1 ? 'اطلاعات خود را وارد کنید.' : 'شماره تلفن خود را برای تایید وارد کنید.'}
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6">
              {error}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleStep1} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">نام و نام خانوادگی</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: علی محمدی"
                  className="w-full px-4 py-3 bg-surface-tertiary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">رمز عبور</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="حداقل ۸ کاراکتر"
                    className="w-full px-4 py-3 pl-11 bg-surface-tertiary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">تکرار رمز عبور</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="رمز عبور را دوباره وارد کنید"
                  className="w-full px-4 py-3 bg-surface-tertiary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
                  required
                  minLength={8}
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                ادامه <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">شماره تلفن</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="۰۹۱۲ ۳۴۵ ۶۷۸۹"
                  className="w-full px-4 py-3 bg-surface-tertiary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'در حال ایجاد حساب...' : 'ایجاد حساب'}
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full py-3 text-text-secondary border border-border hover:bg-surface-tertiary font-medium rounded-xl transition-colors"
              >
                قبلی
              </button>
            </form>
          )}

          {step === 2 && (
            <p className="mt-6 text-center text-sm text-text-secondary">
              قبلاً ثبت‌نام کرده‌اید؟{' '}
              <Link to="/login" className="text-brand-500 hover:text-brand-600 font-medium">ورود</Link>
            </p>
          )}
        </div>
      </div>

      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative text-white max-w-md">
          <Car className="w-16 h-16 mb-6 text-brand-200" />
          <h1 className="text-4xl font-bold mb-4">همین امروز به آتو مارکت بپیوند</h1>
          <p className="text-lg text-brand-200 leading-relaxed">
            حساب کاربری ایجاد کن و در چند دقیقه خرید یا فروش خودرو را شروع کن. رایگان و آسان.
          </p>
          <div className="mt-8 space-y-4">
            {['مرور هزاران آگهی', 'گفتگوی مستقیم با فروشندگان', 'ثبت آگهی رایگان'].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
                <span className="text-brand-100">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

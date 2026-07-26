import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, Save, KeyRound, AlertCircle, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

export default function Settings() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  // Profile fields state (Name & Email)
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Phone Change Wizard State
  const [newPhone, setNewPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState(1); // 1: Send OTP Request, 2: Verify Code
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneSuccess, setPhoneSuccess] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // 1. Handle Profile Update (Name & Email)
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileSuccess('');
    setProfileError('');

    try {
      const res = await api.patch('/auth/accounts/update-me/', { name, email });
      // Update local AuthContext user state
      updateUser(res.data);
      setProfileSuccess('پروفایل با موفقیت به‌روزرسانی شد.');
    } catch (err) {
      if (err.response?.data) {
        const data = err.response.data;
        setProfileError(data.detail || data.name?.[0] || data.email?.[0] || 'خطا در به‌روزرسانی پروفایل.');
      } else {
        setProfileError('خطای شبکه. لطفاً دوباره تلاش کنید.');
      }
    } finally {
      setProfileLoading(false);
    }
  };

  // 2. Step 1: Request Phone Change OTP (Sent to Email)
  const handlePhoneChangeRequest = async (e) => {
    e.preventDefault();
    if (!user?.email) {
      setPhoneError('برای تغییر شماره تلفن، ابتدا باید یک ایمیل ثبت کنید.');
      return;
    }
    setPhoneLoading(true);
    setPhoneSuccess('');
    setPhoneError('');

    try {
      const res = await api.post('/auth/accounts/change-phone/', { new_phone: newPhone });
      setPhoneSuccess(res.data.detail || 'کد تأیید به ایمیل شما ارسال شد.');
      setStep(2); // Move to the verification input step
    } catch (err) {
      if (err.response?.data) {
        const data = err.response.data;
        setPhoneError(data.new_phone?.[0] || data.detail || 'خطا در ارسال کد تأیید.');
      } else {
        setPhoneError('خطای شبکه. لطفاً دوباره تلاش کنید.');
      }
    } finally {
      setPhoneLoading(false);
    }
  };

  // 3. Step 2: Verify Phone Change OTP
  const handlePhoneVerifyAndChange = async (e) => {
    e.preventDefault();
    setPhoneLoading(true);
    setPhoneSuccess('');
    setPhoneError('');

    try {
      const res = await api.post('/auth/accounts/change-phone/verify/', { code: verificationCode });
      // Update local AuthContext with user returned from backend
      updateUser(res.data.user);
      setPhoneSuccess('شماره تلفن با موفقیت به ' + res.data.user.phone + ' تغییر یافت.');
      setNewPhone('');
      setVerificationCode('');
      setStep(1); // Reset back to step 1
    } catch (err) {
      if (err.response?.data) {
        const data = err.response.data;
        setPhoneError(data.code?.[0] || data.detail || 'کد تأیید نامعتبر است.');
      } else {
        setPhoneError('خطای شبکه. لطفاً دوباره تلاش کنید.');
      }
    } finally {
      setPhoneLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8" dir="rtl">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">تنظیمات حساب کاربری</h1>
          <p className="text-text-tertiary text-sm">مدیریت نام، ایمیل و شماره تلفن</p>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 text-sm text-brand-500 hover:text-brand-600 font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> بازگشت به داشبورد
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Security Guide Info Box */}
        <div className="md:col-span-1">
          <div className="bg-surface-secondary rounded-2xl border border-border p-5 space-y-4">
            <h3 className="font-bold text-text-primary text-sm">راهنمای امنیتی</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              برای تغییر شماره تلفن، باید یک ایمیل معتبر در بخش بالا ثبت شده باشد. کد تأیید یکبارمصرف (OTP) به آن ایمیل ارسال می‌شود تا هویت شما تأیید شود.
            </p>
          </div>
        </div>

        {/* Setting Forms Workspace */}
        <div className="md:col-span-2 space-y-6">

          {/* Section 1: Name and Email Update */}
          <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
            <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-brand-500" /> اطلاعات پایه
            </h2>

            {profileSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm mb-5 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                {profileSuccess}
              </div>
            )}

            {profileError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-5 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {profileError}
              </div>
            )}

            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">نام کامل</label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثلاً علی محمدی"
                    className="w-full pr-10 pl-4 py-3 bg-surface-tertiary border border-border rounded-xl text-sm focus:outline-none focus:ring-2
                    focus:ring-brand-500/20"
                    required
                  />
                  <User className="absolute right-3.5 top-3.5 w-4 h-4 text-text-tertiary" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">آدرس ایمیل</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@mail.com"
                    className="w-full pr-10 pl-4 py-3 bg-surface-tertiary border border-border rounded-xl text-sm focus:outline-none focus:ring-2
                    focus:ring-brand-500/20"
                    required
                  />
                  <Mail className="absolute right-3.5 top-3.5 w-4 h-4 text-text-tertiary" />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl
                  transition-colors disabled:opacity-50"
                >
                  {profileLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  ذخیره تغییرات
                </button>
              </div>
            </form>
          </div>

          {/* Section 2: Phone Change (2-Step Verification) */}
          <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
            <h2 className="text-lg font-bold text-text-primary mb-1 flex items-center gap-2">
              <Phone className="w-5 h-5 text-brand-500" /> تغییر شماره تلفن
            </h2>
            <p className="text-xs text-text-tertiary mb-5">
              شماره تلفن فعلی: <strong className="text-text-primary">{user?.phone}</strong>
            </p>

            {phoneSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm mb-5 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                {phoneSuccess}
              </div>
            )}

            {phoneError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-5 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {phoneError}
              </div>
            )}

            {step === 1 ? (
              /* Step 1 Form: Request code for new number */
              <form onSubmit={handlePhoneChangeRequest} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">شماره تلفن جدید</label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="مثلاً ۰۹۱۲۳۴۵۶۷۸۹"
                      className="w-full pr-10 pl-4 py-3 bg-surface-tertiary border border-border rounded-xl text-sm focus:outline-none focus:ring-2
                      focus:ring-brand-500/20"
                      required
                    />
                    <Phone className="absolute right-3.5 top-3.5 w-4 h-4 text-text-tertiary" />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={phoneLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl
                    transition-colors disabled:opacity-50"
                  >
                    {phoneLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                    ارسال کد تأیید
                  </button>
                </div>
              </form>
            ) : (
              /* Step 2 Form: Verify OTP */
              <form onSubmit={handlePhoneVerifyAndChange} className="space-y-4">
                <div className="bg-brand-50 border border-brand-100 p-4 rounded-xl text-sm text-brand-800 leading-relaxed">
                  کد تأیید به ایمیل ثبت‌شده شما ارسال شد. لطفاً آن را در زیر وارد کنید.
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">کد تأیید ۶ رقمی</label>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="۱۲۳۴۵۶"
                      className="w-full pr-10 pl-4 py-3 bg-surface-tertiary border border-border rounded-xl text-sm focus:outline-none focus:ring-2
                      focus:ring-brand-500/20 text-center tracking-widest font-bold"
                      required
                    />
                    <Lock className="absolute right-3.5 top-3.5 w-4 h-4 text-text-tertiary" />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-1/3 py-3 border border-border hover:bg-surface-secondary text-text-primary font-semibold rounded-xl transition-colors"
                  >
                    بازگشت
                  </button>
                  <button
                    type="submit"
                    disabled={phoneLoading}
                    className="w-2/3 flex items-center justify-center gap-2 px-4 py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl
                    transition-colors disabled:opacity-50"
                  >
                    {phoneLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    تأیید و تغییر شماره
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

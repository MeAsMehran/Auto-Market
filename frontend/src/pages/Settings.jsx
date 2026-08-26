import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Save, AlertCircle, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

export default function Settings() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileSuccess('');
    setProfileError('');
    try {
      const res = await api.patch('/auth/accounts/update-me/', { name, email });
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="flex items-center justify-between mb-8 pb-4 border-b border-border"
      >
        <div>
          <h1 className="text-2xl font-bold text-text-primary">تنظیمات حساب کاربری</h1>
          <p className="text-text-tertiary text-sm">مدیریت نام و ایمیل</p>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 text-sm text-brand-500 hover:text-brand-600 font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> بازگشت به داشبورد
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
        className="bg-surface rounded-2xl border border-border p-6 shadow-sm"
      >
        <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-brand-500" /> اطلاعات پایه
        </h2>

            {profileSuccess && (
              <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 px-4 py-3 rounded-xl text-sm mb-5 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                {profileSuccess}
              </div>
            )}

            {profileError && (
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm mb-5 flex items-center gap-2">
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
                    className="w-full pr-10 pl-4 py-3 bg-surface-tertiary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
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
                    className="w-full pr-10 pl-4 py-3 bg-surface-tertiary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    required
                  />
                  <Mail className="absolute right-3.5 top-3.5 w-4 h-4 text-text-tertiary" />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  {profileLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  ذخیره تغییرات
                </button>
              </div>
            </form>
        </motion.div>
    </div>
  );
}

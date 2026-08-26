import { Link } from 'react-router-dom';
import { Car, Mail, Phone, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../hooks/useReducedMotion';

function CarDivider() {
  const reducedMotion = useReducedMotion();
  return (
    <div className="relative h-8 overflow-hidden opacity-30">
      <svg className="absolute top-1/2 -translate-y-1/2" width="100%" height="8" preserveAspectRatio="none">
        <line x1="0" y1="4" x2="100%" y2="4" stroke="currentColor" strokeWidth="1" strokeDasharray="8 6" className="text-brand-400" />
      </svg>
      <motion.div
        className="absolute top-1/2 -translate-y-1/2"
        animate={reducedMotion ? {} : { x: ['-5%', '105%'] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
      >
        <svg width="48" height="18" viewBox="0 0 48 18" fill="currentColor" className="text-brand-300">
          <rect x="6" y="6" width="30" height="9" rx="2" />
          <path d="M13 6 L18 1 L34 1 L37 6" />
          <circle cx="13" cy="17" r="2.5" />
          <circle cx="31" cy="17" r="2.5" />
        </svg>
      </motion.div>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="bg-brand-900 text-white mt-auto">
      <CarDivider />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Car className="w-6 h-6 text-brand-300" />
              <span className="text-lg font-bold">آتو مارکت</span>
            </Link>
            <p className="text-sm text-brand-200 leading-relaxed">
              بزرگترین بازار آنلاین خرید و فروش خودرو. مستقیماً با خریداران و فروشندگان در ارتباط باشید.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-brand-300">لینک‌های سریع</h3>
            <ul className="space-y-2.5">
              <li><Link to="/" className="text-sm text-brand-200 hover:text-white transition-colors">خانه</Link></li>
              <li><Link to="/" className="text-sm text-brand-200 hover:text-white transition-colors">مشاهده خودروها</Link></li>
              <li><Link to="/post-ad" className="text-sm text-brand-200 hover:text-white transition-colors">فروش خودرو</Link></li>
              <li><Link to="/" className="text-sm text-brand-200 hover:text-white transition-colors">برندهای محبوب</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-brand-300">پشتیبانی</h3>
            <ul className="space-y-2.5">
              <li><a href="#" className="text-sm text-brand-200 hover:text-white transition-colors">مرکز راهنما</a></li>
              <li><a href="#" className="text-sm text-brand-200 hover:text-white transition-colors">نکات ایمنی</a></li>
              <li><a href="#" className="text-sm text-brand-200 hover:text-white transition-colors">شرایط استفاده</a></li>
              <li><a href="#" className="text-sm text-brand-200 hover:text-white transition-colors">حریم خصوصی</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-brand-300">تماس با ما</h3>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-2 text-sm text-brand-200">
                <MapPin className="w-4 h-4 shrink-0" /> تهران، ایران
              </li>
              <li className="flex items-center gap-2 text-sm text-brand-200">
                <Mail className="w-4 h-4 shrink-0" /> support@automarket.ir
              </li>
              <li className="flex items-center gap-2 text-sm text-brand-200">
                <Phone className="w-4 h-4 shrink-0" /> +۹۸ ۲۱ ۱۲۳۴ ۵۶۷۸
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-brand-800 mt-8 pt-8 text-center text-sm text-brand-300">
          &copy; {new Date().getFullYear()} آتو مارکت. تمامی حقوق محفوظ است.
        </div>
      </div>
    </footer>
  );
}

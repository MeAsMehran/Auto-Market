import { Link } from 'react-router-dom';
import { Car, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-brand-900 text-white mt-auto">
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

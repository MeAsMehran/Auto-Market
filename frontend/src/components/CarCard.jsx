import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Heart, Car } from 'lucide-react';
import { useState } from 'react';
import { FUEL_LABELS, CITY_LABELS, COLOR_LABELS } from '../lib/constants';
import { useFavorites } from '../context/FavoritesContext';

function formatPrice(price) {
  if (!price) return 'قیمت توافقی';
  return `${(price / 1000000).toLocaleString('fa-IR')} م.تومان`;
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} دقیقه پیش`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ساعت پیش`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} روز پیش`;
  return `${Math.floor(days / 30)} ماه پیش`;
}

const BACKEND_URL = 'http://localhost:8000';

export function fixImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${BACKEND_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

export function getFirstImage(car) {
  if (car.images && car.images.length > 0) return fixImageUrl(car.images[0].image);
  if (car.image) return car.image;
  return '';
}

function ImageWithLoader({ src, alt, className }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!loaded && (
        <div className="absolute inset-0 bg-surface-tertiary animate-shimmer rounded-xl" />
      )}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}

function NoImagePlaceholder({ car, className }) {
  const initials = car.brand ? car.brand.slice(0, 2) : '...';
  return (
    <div className={`relative overflow-hidden ${className} bg-gradient-to-br from-surface-tertiary to-surface-secondary flex flex-col items-center justify-center gap-2`}>
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Car className="w-12 h-12 text-text-tertiary/40" strokeWidth={1.2} />
      </motion.div>
      <span className="text-xl font-bold text-text-tertiary/30 tracking-widest select-none">{initials}</span>
      <span className="text-[10px] text-text-tertiary/50 font-medium">بدون تصویر</span>
    </div>
  );
}

function FavoriteButton({ car, size = 'md' }) {
  const { isLiked, toggleLike } = useFavorites();
  const liked = isLiked(car.id);
  const sizeClasses = size === 'sm'
    ? 'w-7 h-7'
    : 'w-8 h-8';
  const iconClasses = size === 'sm'
    ? 'w-3.5 h-3.5'
    : 'w-4 h-4';
  const posClasses = size === 'sm'
    ? 'top-2 left-2'
    : 'top-3 left-3';

  return (
    <button
      type="button"
      onClick={(e) => toggleLike(car, e)}
      className={`absolute ${posClasses} ${sizeClasses} bg-surface/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-surface transition-colors`}
    >
      <motion.div
        animate={liked ? { scale: [1, 1.4, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        <Heart className={`${iconClasses} transition-colors ${liked ? 'text-red-500 fill-red-500' : 'text-text-tertiary'}`} />
      </motion.div>
    </button>
  );
}

export function CarGridCard({ car, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: 'easeOut' }}
    >
      <Link
        to={`/car/${car.id}`}
        className="group block bg-surface rounded-2xl border border-border overflow-hidden hover:shadow-lg hover:border-brand-500/30 transition-all duration-300"
      >
        <motion.div
          whileHover={{ y: -6 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <div className="relative aspect-[4/3] overflow-hidden bg-surface-tertiary">
            {getFirstImage(car) ? (
              <ImageWithLoader
                src={getFirstImage(car)}
                alt={car.title}
                className="w-full h-full"
              />
            ) : (
              <NoImagePlaceholder car={car} className="w-full h-full" />
            )}
            {car.is_featured && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute top-3 right-3 bg-brand-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-md"
              >
                ویژه
              </motion.span>
            )}
            <FavoriteButton car={car} />
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-text-primary text-sm leading-snug mb-1 line-clamp-2 group-hover:text-brand-500 transition-colors">
              {car.title}
            </h3>
            <p className="text-lg font-bold text-brand-500 mb-2">{formatPrice(car.price)}</p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              <span className="px-2 py-0.5 bg-surface-tertiary text-text-secondary text-xs rounded-lg">{car.year}</span>
              <span className="px-2 py-0.5 bg-surface-tertiary text-text-secondary text-xs rounded-lg">{car.mileage?.toLocaleString('fa-IR')} ک.م</span>
              <span className="px-2 py-0.5 bg-surface-tertiary text-text-secondary text-xs rounded-lg">{FUEL_LABELS[car.fuel_type] || car.fuel_type}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-text-tertiary">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {CITY_LABELS[car.city] || car.city}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {timeAgo(car.created_at)}</span>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

export function CarListCard({ car, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: 'easeOut' }}
    >
      <Link
        to={`/car/${car.id}`}
        className="group flex bg-surface rounded-2xl border border-border overflow-hidden hover:shadow-lg hover:border-brand-500/30 transition-all duration-300"
      >
        <div className="w-48 shrink-0 relative overflow-hidden bg-surface-tertiary">
          {getFirstImage(car) ? (
            <ImageWithLoader
              src={getFirstImage(car)}
              alt={car.title}
              className="w-full h-full"
            />
          ) : (
            <NoImagePlaceholder car={car} className="w-full h-full" />
          )}
          {car.is_featured && (
            <span className="absolute top-2 right-2 bg-brand-500 text-white text-xs font-bold px-2 py-0.5 rounded-lg">ویژه</span>
          )}
          <FavoriteButton car={car} size="sm" />
        </div>
        <div className="flex-1 p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-text-primary group-hover:text-brand-500 transition-colors">{car.title}</h3>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="px-2.5 py-1 bg-surface-tertiary text-text-secondary text-xs rounded-lg">{car.year}</span>
              <span className="px-2.5 py-1 bg-surface-tertiary text-text-secondary text-xs rounded-lg">{car.mileage?.toLocaleString('fa-IR')} ک.م</span>
              <span className="px-2.5 py-1 bg-surface-tertiary text-text-secondary text-xs rounded-lg">{FUEL_LABELS[car.fuel_type] || car.fuel_type}</span>
              <span className="px-2.5 py-1 bg-surface-tertiary text-text-secondary text-xs rounded-lg">{COLOR_LABELS[car.color] || car.color}</span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3">
            <div>
              <p className="text-lg font-bold text-brand-500">{formatPrice(car.price)}</p>
              <div className="flex items-center gap-3 text-xs text-text-tertiary mt-0.5">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {CITY_LABELS[car.city] || car.city}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {timeAgo(car.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

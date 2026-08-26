import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Car } from 'lucide-react';
import { useReducedMotion } from '../hooks/useReducedMotion';

const MIN_DURATION = 450; // ms — just long enough to avoid a flash, short enough to feel instant

/**
 * A short branded splash shown only on a hard refresh. App.jsx only mounts
 * once per page load (router navigation doesn't remount it), so this naturally
 * shows on refresh and stays hidden during in-app route changes.
 */
export default function Splash() {
  const [visible, setVisible] = useState(true);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), MIN_DURATION);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500"
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="flex flex-col items-center gap-4"
          >
            <motion.div
              animate={reducedMotion ? {} : { y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-20 h-20 rounded-2xl bg-white/15 flex items-center justify-center shadow-2xl ring-1 ring-white/20"
            >
              <Car className="w-10 h-10 text-white" strokeWidth={1.8} />
            </motion.div>

            <div className="text-center">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                آتو مارکت
              </h1>
              <p className="text-sm text-brand-100 mt-1">
                خرید و فروش خودرو
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
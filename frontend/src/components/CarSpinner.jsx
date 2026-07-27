import { motion } from 'framer-motion';

export default function CarSpinner({ size = 'md' }) {
  const sizes = { sm: 48, md: 80, lg: 120 };
  const s = sizes[size] || sizes.md;

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={s} height={s * 0.5} viewBox="0 0 120 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Road line */}
        <motion.line
          x1="0" y1="55" x2="120" y2="55"
          stroke="currentColor" strokeWidth="1" strokeDasharray="6 4"
          className="text-border"
          animate={{ strokeDashoffset: [0, -20] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
        />

        {/* Car body */}
        <motion.g
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Main body */}
          <rect x="20" y="30" width="70" height="20" rx="4" fill="var(--color-brand-500)" />
          {/* Roof */}
          <path d="M35 30 L45 15 L70 15 L78 30" fill="var(--color-brand-600)" />
          {/* Windows */}
          <path d="M47 17 L40 28 L58 28 L58 17Z" fill="white" opacity="0.8" />
          <path d="M60 17 L60 28 L75 28 L68 17Z" fill="white" opacity="0.6" />
          {/* Headlight */}
          <rect x="88" y="35" width="5" height="4" rx="1" fill="#fbbf24" />
          {/* Taillight */}
          <rect x="18" y="35" width="4" height="4" rx="1" fill="#ef4444" />
        </motion.g>

        {/* Front wheel */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '75px 52px' }}
        >
          <circle cx="75" cy="52" r="7" fill="var(--color-text-primary)" />
          <circle cx="75" cy="52" r="3" fill="var(--color-surface-tertiary)" />
          <line x1="75" y1="46" x2="75" y2="58" stroke="var(--color-surface-tertiary)" strokeWidth="1" />
          <line x1="69" y1="52" x2="81" y2="52" stroke="var(--color-surface-tertiary)" strokeWidth="1" />
        </motion.g>

        {/* Rear wheel */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '35px 52px' }}
        >
          <circle cx="35" cy="52" r="7" fill="var(--color-text-primary)" />
          <circle cx="35" cy="52" r="3" fill="var(--color-surface-tertiary)" />
          <line x1="35" y1="46" x2="35" y2="58" stroke="var(--color-surface-tertiary)" strokeWidth="1" />
          <line x1="29" y1="52" x2="41" y2="52" stroke="var(--color-surface-tertiary)" strokeWidth="1" />
        </motion.g>
      </svg>
      <p className="text-sm text-text-secondary animate-pulse">در حال بارگذاری...</p>
    </div>
  );
}

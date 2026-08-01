import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

const ThemeContext = createContext(null);

const LIGHT_BG = 'rgba(248, 250, 252, 0.88)';
const DARK_BG = 'rgba(15, 23, 42, 0.88)';

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [overlay, setOverlay] = useState(null);
  const animatingRef = useRef(false);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    if (animatingRef.current) return;
    animatingRef.current = true;

    const newTheme = theme === 'light' ? 'dark' : 'light';
    const newBg = newTheme === 'dark' ? DARK_BG : LIGHT_BG;
    const key = Date.now();

    setOverlay({ color: newBg, key });

    const ANIM_MS = 850;

    setTimeout(() => {
      setTheme(newTheme);
    }, ANIM_MS - 60);

    setTimeout(() => {
      setOverlay(null);
      animatingRef.current = false;
    }, ANIM_MS + 120);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
      {createPortal(
        overlay && (
          <div
            key={overlay.key}
            className="theme-curtain"
            style={{ backgroundColor: overlay.color }}
          />
        ),
        document.body
      )}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
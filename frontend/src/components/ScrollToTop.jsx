import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname } = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    // On initial load/refresh jump instantly so the page always opens at the
    // top; on later route changes, scroll smoothly.
    const behavior = isFirstRender.current ? 'instant' : 'smooth';
    isFirstRender.current = false;
    window.scrollTo({ top: 0, behavior });
  }, [pathname]);

  return null;
}

export function markInternalNavigation() {
  sessionStorage.setItem('internalNavigation', 'true');
}

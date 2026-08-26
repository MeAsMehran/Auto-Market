import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from './context/ThemeContext'
import './index.css'
import App from './App.jsx'

// Prevent the browser from restoring the old scroll position on refresh,
// so the page always starts at the top.
if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

createRoot(document.getElementById('root')).render(
  <>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </>,
)

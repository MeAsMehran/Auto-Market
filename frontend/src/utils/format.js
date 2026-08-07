/**
 * Format price with currency symbol
 * @param {number|string} price - The price value
 * @returns {string} Formatted price string
 */
export const formatPrice = (price) => {
  if (!price) return 'توافقی';
  
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numPrice)) return 'توافقی';
  
  // Format with Persian numerals and appropriate currency
  const formatted = numPrice.toLocaleString('fa-IR');
  return `${formatted} تومان`;
};

/**
 * Format number with Persian numerals
 * @param {number} num - The number to format
 * @returns {string} Formatted number string
 */
export const formatNumber = (num) => {
  if (!num && num !== 0) return '۰';
  return num.toLocaleString('fa-IR');
};

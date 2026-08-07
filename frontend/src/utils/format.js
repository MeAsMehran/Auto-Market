const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

const toPersianNumber = (value) => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  return str.replace(/\d/g, (d) => persianDigits[parseInt(d, 10)]);
};

export const formatPrice = (price) => {
  if (!price) return 'توافقی';

  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numPrice)) return 'توافقی';

  const formatted = numPrice.toLocaleString('fa-IR');
  return `${formatted} تومان`;
};

export const formatNumber = (num) => {
  if (!num && num !== 0) return '۰';
  return num.toLocaleString('fa-IR');
};

export const formatTimeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${toPersianNumber(mins)} دقیقه پیش`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${toPersianNumber(hours)} ساعت پیش`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${toPersianNumber(days)} روز پیش`;
  return `${toPersianNumber(Math.floor(days / 30))} ماه پیش`;
};

export { toPersianNumber };


export const validateLuhn = (number) => {
  const sanitized = number.replace(/\D/g, '');
  if (!sanitized || sanitized.length < 13) return false; // Basic length check
  let sum = 0;
  let shouldDouble = false;
  for (let i = sanitized.length - 1; i >= 0; i--) {
    let digit = parseInt(sanitized.charAt(i));
    if (shouldDouble) {
      if ((digit *= 2) > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return (sum % 10) === 0;
};

export const getCardType = (number) => {
  const sanitized = number.replace(/\D/g, '');
  if (/^4/.test(sanitized)) return 'Visa';
  if (/^5[1-5]/.test(sanitized) || /^2[2-7]/.test(sanitized)) return 'Mastercard';
  if (/^3[47]/.test(sanitized)) return 'Amex';
  if (/^6(?:011|5)/.test(sanitized)) return 'Discover';
  return 'Desconocida';
};

export const formatCardNumber = (value) => {
  const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
  const matches = v.match(/\d{4,16}/g);
  const match = matches && matches[0] || '';
  const parts = [];
  for (let i = 0, len = match.length; i < len; i += 4) {
    parts.push(match.substring(i, i + 4));
  }
  if (parts.length) {
    return parts.join(' ');
  } else {
    return value;
  }
};

export const validateExpiryDate = (date) => {
  if (!date || date.length !== 5) return false;
  const [month, year] = date.split('/');
  if (!month || !year) return false;
  
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);
  
  if (isNaN(m) || isNaN(y)) return false;
  if (m < 1 || m > 12) return false;
  
  const currentYear = new Date().getFullYear() % 100; // Last 2 digits
  const currentMonth = new Date().getMonth() + 1;
  
  if (y < currentYear) return false;
  if (y === currentYear && m < currentMonth) return false;
  
  return true;
};

export const formatExpiryDate = (value) => {
  const v = value.replace(/\D/g, '').slice(0, 4);
  if (v.length >= 3) {
    return `${v.slice(0, 2)}/${v.slice(2)}`;
  }
  return v;
};

export const validateCVV = (cvv) => {
  return /^\d{3,4}$/.test(cvv);
};

export const validateCardName = (name) => {
  // Letters and spaces only, min 5, max 50
  if (!name) return false;
  if (name.length < 5 || name.length > 50) return false;
  return /^[a-zA-Z\s]+$/.test(name);
};

export const capitalizeName = (name) => {
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Format currency
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount);
};

// Format date
export const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-IN', options);
};

// Format date with time
export const formatDateTime = (dateString) => {
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return new Date(dateString).toLocaleDateString('en-IN', options);
};

// Calculate age from date of birth
export const calculateAge = (dob) => {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

// Truncate text with ellipsis
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};

// Generate random color
export const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

// Email validation
export const isValidEmail = (email) => {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(String(email).toLowerCase());
};

// Phone number validation (Indian format)
export const isValidPhone = (phone) => {
  const re = /^[6-9]\d{9}$/;
  return re.test(phone);
};

// Password strength validation
export const getPasswordStrength = (password) => {
  if (!password) return { score: 0, message: 'No password' };
  
  let score = 0;
  let message = '';
  
  // Length check
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  
  // Complexity checks
  if (/[A-Z]/.test(password)) score += 1; // Has uppercase
  if (/[a-z]/.test(password)) score += 1; // Has lowercase
  if (/[0-9]/.test(password)) score += 1; // Has number
  if (/[^A-Za-z0-9]/.test(password)) score += 1; // Has special char
  
  // Determine message based on score
  if (score < 3) {
    message = 'Weak';
  } else if (score < 5) {
    message = 'Moderate';
  } else {
    message = 'Strong';
  }
  
  return { score, message };
};

// Calculate total from array of objects
export const calculateTotal = (items, key) => {
  if (!items || !items.length) return 0;
  return items.reduce((total, item) => total + (parseFloat(item[key]) || 0), 0);
};

// Sort array of objects by key
export const sortByKey = (array, key, order = 'asc') => {
  return [...array].sort((a, b) => {
    if (a[key] < b[key]) return order === 'asc' ? -1 : 1;
    if (a[key] > b[key]) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

// Filter array of objects by search term
export const filterBySearchTerm = (array, searchTerm, keys) => {
  if (!searchTerm) return array;
  
  const lowercasedTerm = searchTerm.toLowerCase();
  
  return array.filter(item => {
    return keys.some(key => {
      const value = item[key];
      if (typeof value === 'string') {
        return value.toLowerCase().includes(lowercasedTerm);
      }
      return false;
    });
  });
};

// Group array of objects by key
export const groupByKey = (array, key) => {
  return array.reduce((result, item) => {
    const groupKey = item[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {});
};

// Generate chart colors
export const generateChartColors = (count) => {
  const baseColors = [
    '#4299E1', // blue
    '#48BB78', // green
    '#F6AD55', // orange
    '#F56565', // red
    '#9F7AEA', // purple
    '#ED64A6', // pink
    '#38B2AC', // teal
    '#ECC94B'  // yellow
  ];
  
  // If we need more colors than in our base array, generate random ones
  if (count <= baseColors.length) {
    return baseColors.slice(0, count);
  }
  
  const colors = [...baseColors];
  for (let i = baseColors.length; i < count; i++) {
    colors.push(getRandomColor());
  }
  
  return colors;
};
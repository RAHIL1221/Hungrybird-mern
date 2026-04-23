const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // If it's already a full URL (Cloudinary or external), return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Replace backslashes with forward slashes (Windows path issue)
  let cleanPath = imagePath.replace(/\\/g, '/');
  
  // Remove duplicate /uploads/ if it exists
  cleanPath = cleanPath.replace(/^\/uploads\/uploads\//, '/uploads/');
  cleanPath = cleanPath.replace(/^uploads\/uploads\//, '/uploads/');
  
  // If path starts with /, it's already formatted correctly
  if (cleanPath.startsWith('/')) {
    return `${API_URL}${cleanPath}`;
  }
  
  // If path starts with uploads/, add leading slash
  if (cleanPath.startsWith('uploads/')) {
    return `${API_URL}/${cleanPath}`;
  }
  
  // Otherwise, assume it's just a filename and add /uploads/ prefix
  return `${API_URL}/uploads/${cleanPath}`;
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

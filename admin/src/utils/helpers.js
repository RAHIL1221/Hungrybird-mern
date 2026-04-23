import { format, formatDistanceToNow } from 'date-fns';

export const fmt = {
  date: (d) => d ? format(new Date(d), 'MMM dd, yyyy') : '—',
  datetime: (d) => d ? format(new Date(d), 'MMM dd, yyyy HH:mm') : '—',
  ago: (d) => d ? formatDistanceToNow(new Date(d), { addSuffix: true }) : '—',
  currency: (n) => `$${(n || 0).toFixed(2)}`,
  number: (n) => (n || 0).toLocaleString(),
};

export const getInitials = (name = '') =>
  name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

export const avatarColor = (name = '') => {
  const colors = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444'];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
};

export const statusOrder = ['pending','confirmed','preparing','out_for_delivery','delivered','cancelled'];

export const statusLabel = (s) => s?.replace(/_/g, ' ') || '';

export const buildFormData = (obj) => {
  const fd = new FormData();
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null) {
      // Handle nested objects by flattening them
      if (typeof v === 'object' && !(v instanceof File) && !(v instanceof Blob) && !Array.isArray(v)) {
        Object.entries(v).forEach(([nestedKey, nestedValue]) => {
          if (nestedValue !== undefined && nestedValue !== null) {
            fd.append(`${k}.${nestedKey}`, nestedValue);
          }
        });
      } else if (Array.isArray(v)) {
        // Handle arrays by appending each item or joining as string
        v.forEach(item => fd.append(k, item));
      } else {
        fd.append(k, v);
      }
    }
  });
  return fd;
};

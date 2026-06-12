import { ExpiryStatus, VehicleDocument } from './types';

/**
 * Calculates the number of calendar days between today and the target date.
 * If target date is in the past, returns a negative value.
 */
export const getDaysRemaining = (targetDateStr: string, virtualToday?: Date): number => {
  const today = virtualToday || new Date();
  const todayCopy = new Date(today.getTime());
  todayCopy.setHours(0, 0, 0, 0);
  
  const target = new Date(targetDateStr);
  target.setHours(0, 0, 0, 0);
  
  const diffTime = target.getTime() - todayCopy.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Determines the expiration warning tier based on days remaining.
 */
export const getExpiryStatus = (
  doc: VehicleDocument,
  warningThresholdDays: number = 30,
  virtualToday?: Date
): ExpiryStatus => {
  // If it's a traffic challan, a paid challan is always considered valid/resolved!
  if (doc.type === 'challan' && doc.isChallanPaid) {
    return 'valid';
  }
  
  const days = getDaysRemaining(doc.expiryDate, virtualToday);
  if (days <= 0) {
    return 'expired';
  } else if (days <= warningThresholdDays) {
    return 'expiring_soon';
  }
  return 'valid';
};

/**
 * Formats countdown days into human-friendly language.
 */
export const formatDaysRemaining = (days: number): { text: string; colorClass: string; bgClass: string; borderClass: string } => {
  if (days < 0) {
    const absDays = Math.abs(days);
    return {
      text: `${absDays} ${absDays === 1 ? 'day' : 'days'} expired`,
      colorClass: 'text-red-700 font-semibold',
      bgClass: 'bg-red-50',
      borderClass: 'border-red-200'
    };
  } else if (days === 0) {
    return {
      text: 'Expires today!',
      colorClass: 'text-red-700 font-bold pulse-anim',
      bgClass: 'bg-red-100',
      borderClass: 'border-red-300'
    };
  } else if (days <= 30) {
    return {
      text: `${days} ${days === 1 ? 'day' : 'days'} left`,
      colorClass: 'text-amber-800 font-medium',
      bgClass: 'bg-amber-50',
      borderClass: 'border-amber-200'
    };
  } else {
    return {
      text: `${days} days left`,
      colorClass: 'text-emerald-700 font-normal',
      bgClass: 'bg-emerald-50/50',
      borderClass: 'border-emerald-100'
    };
  }
};

/**
 * Helper to display human-readable file sizes.
 */
export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Validates vehicle license plate basic Indian or standard commercial patterns
 */
export const validatePlateNumber = (plate: string): boolean => {
  const cleaned = plate.trim().toUpperCase();
  return cleaned.length >= 4 && cleaned.length <= 15;
};

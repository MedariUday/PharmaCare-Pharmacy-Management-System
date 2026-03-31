/**
 * Safely formats an expiry date for consistent UI display.
 * Prevents "Jan 1970" (Unix epoch) issues by validating the date existence and value.
 * 
 * @param {string|Date|null} date - The date string or object to format
 * @returns {string} - Formatted date (e.g., "Nov 2027") or "Expiry not set"
 */
export const formatExpiryDate = (date) => {
  if (!date) return "Expiry not set";
  
  const d = new Date(date);
  
  // Check if invalid date or Unix epoch (approx 1970)
  if (isNaN(d.getTime()) || d.getFullYear() <= 1970) {
    return "Expiry not set";
  }
  
  return d.toLocaleDateString('en-IN', { 
    month: 'short', 
    year: 'numeric' 
  });
};

/**
 * Checks if a medicine is nearing expiry (within 30 days).
 * Returns false if the date is invalid, missing or already expired.
 */
export const isNearingExpiry = (date) => {
  if (!date) return false;
  
  const d = new Date(date);
  if (isNaN(d.getTime()) || d.getFullYear() <= 1970) return false;
  
  const today = new Date();
  const threshold = new Date();
  threshold.setDate(threshold.getDate() + 30);
  
  // Nearing expiry means it is NOT yet expired but will be in 30 days
  return d > today && d <= threshold;
};

/**
 * Checks if a medicine is already expired.
 */
export const isExpired = (date) => {
  if (!date) return false;
  
  const d = new Date(date);
  if (isNaN(d.getTime()) || d.getFullYear() <= 1970) return false;
  
  const today = new Date();
  return d < today;
};

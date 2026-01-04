/**
 * Convert pesewas to GHS
 * @param {number} pesewas - Amount in pesewas
 * @returns {number} Amount in GHS
 */
export const pesewasToGHS = (pesewas) => {
  if (!pesewas || isNaN(pesewas)) return 0;
  return (pesewas / 100).toFixed(2);
};

/**
 * Format currency for display
 * @param {number} pesewas - Amount in pesewas
 * @returns {string} Formatted currency string (e.g., "GHS 500.00")
 */
export const formatCurrency = (pesewas) => {
  if (!pesewas || isNaN(pesewas)) return 'GHS 0.00';
  return `GHS ${pesewasToGHS(pesewas)}`;
};

/**
 * Convert GHS to pesewas
 * @param {number} ghs - Amount in GHS
 * @returns {number} Amount in pesewas
 */
export const ghsToPesewas = (ghs) => {
  if (!ghs || isNaN(ghs)) return 0;
  return Math.round(ghs * 100);
};

/**
 * Format large numbers with commas
 * @param {number} amount - Amount to format
 * @returns {string} Formatted number
 */
export const formatNumber = (amount) => {
  if (!amount || isNaN(amount)) return '0';
  return amount.toLocaleString('en-US');
};

/**
 * Format currency with number formatting
 * @param {number} pesewas - Amount in pesewas
 * @returns {string} Formatted currency with commas
 */
export const formatCurrencyWithCommas = (pesewas) => {
  if (!pesewas || isNaN(pesewas)) return 'GHS 0.00';
  const ghs = pesewasToGHS(pesewas);
  return `GHS ${parseFloat(ghs).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

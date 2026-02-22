const config = require('../config');

/**
 * Calculate price with markup
 * @param {number} basePrice - Base price from API
 * @returns {number} - Price with markup
 */
function calculatePrice(basePrice) {
  return basePrice + config.markup.price;
}

/**
 * Format price to IDR currency
 * @param {number} price - Price to format
 * @returns {string} - Formatted price
 */
function formatPrice(price) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(price);
}

/**
 * Get current markup value
 * @returns {number} - Current markup price
 */
function getMarkup() {
  return config.markup.price;
}

module.exports = {
  calculatePrice,
  formatPrice,
  getMarkup
};

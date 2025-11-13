const crypto = require('crypto');

/**
 * Generate a random short code using base62 encoding
 * @param {number} length - Length of the short code
 * @returns {string} Generated short code
 */
const generateShortCode = (length = 6) => {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  
  const randomBytes = crypto.randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    result += chars[randomBytes[i] % chars.length];
  }
  
  return result;
};

/**
 * Validate if a string is a valid URL
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid URL
 */
const isValidUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch (error) {
    return false;
  }
};

/**
 * Validate custom alias
 * @param {string} alias - Custom alias to validate
 * @returns {boolean} True if valid alias
 */
const isValidAlias = (alias) => {
  // Only allow alphanumeric characters, hyphens, and underscores
  // Length between 3 and 20 characters
  const aliasRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  return aliasRegex.test(alias);
};

module.exports = {
  generateShortCode,
  isValidUrl,
  isValidAlias,
};

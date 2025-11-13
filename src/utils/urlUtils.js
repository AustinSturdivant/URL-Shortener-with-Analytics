const crypto = require('crypto');

/**
 * Generate a random short code using base62 encoding
 * Uses rejection sampling to avoid modulo bias
 * @param {number} length - Length of the short code
 * @returns {string} Generated short code
 */
const generateShortCode = (length = 6) => {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const charsLength = chars.length;
  let result = '';
  
  // Calculate the largest multiple of charsLength that fits in a byte
  const maxValid = 256 - (256 % charsLength);
  
  while (result.length < length) {
    const randomBytes = crypto.randomBytes(length - result.length);
    
    for (let i = 0; i < randomBytes.length && result.length < length; i++) {
      const byte = randomBytes[i];
      // Use rejection sampling to avoid modulo bias
      if (byte < maxValid) {
        result += chars[byte % charsLength];
      }
    }
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

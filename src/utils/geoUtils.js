const geoip = require('geoip-lite');

/**
 * Get geographical information from IP address
 * @param {string} ipAddress - IP address to lookup
 * @returns {Object} Geographical information
 */
const getLocationFromIP = (ipAddress) => {
  // Handle localhost or private IPs
  if (!ipAddress || ipAddress === '::1' || ipAddress === '127.0.0.1' || ipAddress.startsWith('192.168.')) {
    return {
      country: 'Local',
      city: 'Local',
    };
  }

  const geo = geoip.lookup(ipAddress);
  
  if (geo) {
    return {
      country: geo.country || 'Unknown',
      city: geo.city || 'Unknown',
    };
  }

  return {
    country: 'Unknown',
    city: 'Unknown',
  };
};

module.exports = { getLocationFromIP };

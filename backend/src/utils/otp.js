import crypto from 'crypto';

/**
 * Generate a random OTP of specified length
 * @param {number} length - Length of the OTP (default: 6)
 * @returns {string} - Generated OTP
 */
export const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  
  // Generate random bytes
  const randomBytes = crypto.randomBytes(length);
  
  // Convert random bytes to OTP
  for (let i = 0; i < length; i++) {
    const randomIndex = randomBytes[i] % digits.length;
    otp += digits[randomIndex];
  }
  
  return otp;
};

/**
 * Validate if an OTP is expired
 * @param {Date} expiryTime - OTP expiry timestamp
 * @returns {boolean} - Whether OTP is expired
 */
export const isOTPExpired = (expiryTime) => {
  return Date.now() > expiryTime;
};

/**
 * Validate if an OTP matches
 * @param {string} inputOTP - OTP entered by user
 * @param {string} storedOTP - OTP stored in database
 * @param {Date} expiryTime - OTP expiry timestamp
 * @returns {boolean} - Whether OTP is valid
 */
export const validateOTP = (inputOTP, storedOTP, expiryTime) => {
  if (!inputOTP || !storedOTP || !expiryTime) {
    return false;
  }
  
  if (isOTPExpired(expiryTime)) {
    return false;
  }
  
  return inputOTP === storedOTP;
}; 
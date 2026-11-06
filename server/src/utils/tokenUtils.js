import crypto from 'crypto';

/**
 * Generate a cryptographically secure random token string
 * @param {number} bytes - Byte length (default 32 -> 64 hex chars)
 * @returns {string} Plaintext token
 */
export const generateSecureToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

/**
 * Hash a token using SHA-256 for secure database storage
 * @param {string} token - Raw token string
 * @returns {string} Hashed hex string
 */
export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

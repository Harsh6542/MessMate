import rateLimit from 'express-rate-limit';

// Strict limiter for authentication attempts (email/password & staff ID/PIN)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Max 15 login attempts per IP per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts from this IP. For security reasons, please try again after 15 minutes.'
    }
  }
});

// Limiter for password reset requests to prevent inbox spamming or token enumeration
export const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'FORGOT_PASSWORD_LIMIT_EXCEEDED',
      message: 'Too many password reset requests. Please wait 15 minutes before trying again.'
    }
  }
});

// Limiter for account registrations
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'REGISTER_LIMIT_EXCEEDED',
      message: 'Registration limit reached for this IP. Please try again later.'
    }
  }
});


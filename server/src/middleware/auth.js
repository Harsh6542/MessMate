import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/User.js';

export const authenticate = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Extract token from HTTP-only cookie first
  if (req.cookies && req.cookies.messmate_jwt) {
    token = req.cookies.messmate_jwt;
  }
  // Fallback to Bearer token header if present
  else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError(
        'Authentication required. Please log in to access this resource.',
        401,
        'AUTH_REQUIRED'
      )
    );
  }

  // 2. Verify token signature
  const decoded = jwt.verify(
    token,
    process.env.JWT_SECRET || 'messmate_dev_jwt_secret_key_change_in_production_2026_super_secure'
  );

  // 3. Check if user still exists
  const currentUser = await User.findById(decoded.id).select('+isActive');
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this session token no longer exists.',
        401,
        'USER_NOT_FOUND'
      )
    );
  }

  // 4. Check if account is active
  if (!currentUser.isActive) {
    return next(
      new AppError(
        'This account has been deactivated. Please contact hostel administration.',
        403,
        'ACCOUNT_DEACTIVATED'
      )
    );
  }

  // 5. Grant access: attach user to req
  req.user = currentUser;
  next();
});

export default authenticate;


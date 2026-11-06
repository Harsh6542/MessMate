import { AppError } from '../utils/AppError.js';

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(
        new AppError('User authentication context not found.', 401, 'AUTH_REQUIRED')
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access forbidden. Role '${req.user.role}' is not authorized to perform this action.`,
          403,
          'FORBIDDEN_ROLE'
        )
      );
    }

    next();
  };
};

export default authorize;


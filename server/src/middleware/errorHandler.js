import { AppError } from '../utils/AppError.js';

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400, 'INVALID_IDENTIFIER');
};

const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue || {})[0] || 'field';
  const val = err.keyValue ? err.keyValue[field] : 'value';
  const message = `Duplicate value '${val}' for field '${field}'. Please use another value.`;
  return new AppError(message, 409, 'DUPLICATE_ENTRY', { field, value: val });
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Validation error. ${errors.join('. ')}`;
  return new AppError(message, 422, 'VALIDATION_FAILED', errors);
};

const handleJWTError = () =>
  new AppError('Invalid authentication token. Please log in again.', 401, 'INVALID_TOKEN');

const handleJWTExpiredError = () =>
  new AppError('Your authentication token has expired. Please log in again.', 401, 'TOKEN_EXPIRED');

export const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  let error = { ...err };
  error.message = err.message;
  error.name = err.name;
  error.stack = err.stack;

  if (error.name === 'CastError') error = handleCastErrorDB(error);
  if (err.code === 11000) error = handleDuplicateFieldsDB(err);
  if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
  if (error.name === 'JsonWebTokenError') error = handleJWTError();
  if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

  const response = {
    success: false,
    error: {
      code: error.errorCode || 'INTERNAL_ERROR',
      message: error.message || 'An unexpected error occurred.',
      ...(error.details ? { details: error.details } : {})
    }
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
  }

  res.status(error.statusCode).json(response);
};

export default errorHandler;


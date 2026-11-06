import { validationResult } from 'express-validator';
import { AppError } from '../utils/AppError.js';

export const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    for (const validation of validations) {
      const result = await validation.run(req);
      if (result.errors.length) break;
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const extractedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg
    }));

    return next(
      new AppError(
        extractedErrors[0].message,
        422,
        'VALIDATION_ERROR',
        extractedErrors
      )
    );
  };
};

export default validate;


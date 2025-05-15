import { validationResult } from 'express-validator';
import { AppError } from './errorHandler.js';

export const validationHandler = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const extractedErrors = errors.array().map(err => ({
      field: err.path,
      message: err.msg
    }));

    return next(new AppError('Validation Error', 400, extractedErrors));
  };
}; 
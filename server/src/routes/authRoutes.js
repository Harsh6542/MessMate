import express from 'express';
import {
  register,
  login,
  staffLogin,
  logout,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  registerValidator,
  loginValidator,
  staffLoginValidator,
  changePasswordValidator,
  forgotPasswordValidator,
  resetPasswordValidator
} from '../validators/authValidators.js';
import { authLimiter, forgotPasswordLimiter, registerLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register', registerLimiter, validate(registerValidator), register);
router.post('/login', authLimiter, validate(loginValidator), login);
router.post('/staff-login', authLimiter, validate(staffLoginValidator), staffLogin);
router.post('/forgot-password', forgotPasswordLimiter, validate(forgotPasswordValidator), forgotPassword);
router.post('/reset-password/:token', authLimiter, validate(resetPasswordValidator), resetPassword);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, validate(changePasswordValidator), changePassword);

export default router;

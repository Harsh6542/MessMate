import express from 'express';
import {
  register,
  login,
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
  changePasswordValidator,
  forgotPasswordValidator,
  resetPasswordValidator
} from '../validators/authValidators.js';

const router = express.Router();

router.post('/register', validate(registerValidator), register);
router.post('/login', validate(loginValidator), login);
router.post('/forgot-password', validate(forgotPasswordValidator), forgotPassword);
router.post('/reset-password/:token', validate(resetPasswordValidator), resetPassword);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, validate(changePasswordValidator), changePassword);

export default router;

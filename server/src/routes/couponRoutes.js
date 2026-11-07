import express from 'express';
import {
  generateCoupon,
  verifyCoupon,
  manualVerify,
  getWallet,
  payCounter,
  getCounterQR,
  getCounterPayments
} from '../controllers/couponController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(authenticate);

// Student routes
router.get('/wallet', authorize(ROLES.STUDENT), getWallet);
router.post('/pay-counter', authorize(ROLES.STUDENT), payCounter);
router.post('/generate', authorize(ROLES.STUDENT), generateCoupon);

// Staff / Manager verification routes
router.post('/verify', authorize(ROLES.MESS_STAFF, ROLES.MESS_MANAGER, ROLES.ADMIN), verifyCoupon);
router.post('/manual-verify', authorize(ROLES.MESS_STAFF, ROLES.MESS_MANAGER, ROLES.ADMIN), manualVerify);
router.get('/counter-qr', authorize(ROLES.MESS_STAFF, ROLES.MESS_MANAGER, ROLES.ADMIN), getCounterQR);
router.get('/counter-payments', authorize(ROLES.MESS_STAFF, ROLES.MESS_MANAGER, ROLES.ADMIN), getCounterPayments);

export default router;

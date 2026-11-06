import express from 'express';
import {
  generateCoupon,
  verifyCoupon,
  manualVerify
} from '../controllers/couponController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(authenticate);

router.post('/generate', authorize(ROLES.STUDENT), generateCoupon);
router.post('/verify', authorize(ROLES.MESS_STAFF, ROLES.MESS_MANAGER, ROLES.ADMIN), verifyCoupon);
router.post('/manual-verify', authorize(ROLES.MESS_STAFF, ROLES.MESS_MANAGER, ROLES.ADMIN), manualVerify);

export default router;


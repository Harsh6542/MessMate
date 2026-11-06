import express from 'express';
import { getPrediction, updateQuantity, getKitchenPrepSheet } from '../controllers/demandController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(authenticate);

router.get(
  '/prep-sheet',
  authorize(ROLES.MESS_STAFF, ROLES.MESS_MANAGER, ROLES.WARDEN, ROLES.ADMIN),
  getKitchenPrepSheet
);

router.get(
  '/prediction/:sessionId',
  authorize(ROLES.MESS_STAFF, ROLES.MESS_MANAGER, ROLES.WARDEN, ROLES.ADMIN),
  getPrediction
);

router.put(
  '/adjust-quantity/:sessionId',
  authorize(ROLES.MESS_MANAGER, ROLES.ADMIN),
  updateQuantity
);

export default router;

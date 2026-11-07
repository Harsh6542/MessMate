import express from 'express';
import { recordWasteLog, getWasteLogs, getWasteSummary } from '../controllers/wasteLogController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(authenticate);

router.post(
  '/',
  authorize(ROLES.MESS_STAFF, ROLES.MESS_MANAGER, ROLES.ADMIN),
  recordWasteLog
);

router.get(
  '/',
  authorize(ROLES.MESS_STAFF, ROLES.MESS_MANAGER, ROLES.ADMIN),
  getWasteLogs
);

router.get(
  '/summary',
  authorize(ROLES.MESS_MANAGER, ROLES.ADMIN),
  getWasteSummary
);

export default router;

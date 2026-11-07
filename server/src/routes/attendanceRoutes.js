import express from 'express';
import {
  getMyAttendance,
  getSessionAttendance
} from '../controllers/attendanceController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(authenticate);

router.get('/my-history', authorize(ROLES.STUDENT), getMyAttendance);
router.get(
  '/session/:sessionId',
  authorize(ROLES.MESS_STAFF, ROLES.MESS_MANAGER, ROLES.ADMIN),
  getSessionAttendance
);

export default router;


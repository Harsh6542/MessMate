import express from 'express';
import {
  getStudentDashboard,
  getStaffDashboard,
  getManagerDashboard,
  getAdminDashboard
} from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(authenticate);

router.get('/student', authorize(ROLES.STUDENT), getStudentDashboard);
router.get('/staff', authorize(ROLES.MESS_STAFF), getStaffDashboard);
router.get('/manager', authorize(ROLES.MESS_MANAGER), getManagerDashboard);
router.get('/admin', authorize(ROLES.ADMIN), getAdminDashboard);

export default router;


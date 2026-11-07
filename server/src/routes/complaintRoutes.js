import express from 'express';
import {
  createComplaint,
  getComplaints,
  getComplaintById,
  respondToComplaint,
  updateComplaintStatus,
  reopenStudentComplaint
} from '../controllers/complaintController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(authenticate);

router.post('/', authorize(ROLES.STUDENT), createComplaint);
router.get('/', getComplaints);
router.get('/:id', getComplaintById);
router.post(
  '/:id/respond',
  authorize(ROLES.MESS_MANAGER, ROLES.ADMIN),
  respondToComplaint
);
router.put(
  '/:id/status',
  authorize(ROLES.MESS_MANAGER, ROLES.ADMIN),
  updateComplaintStatus
);
router.post('/:id/reopen', authorize(ROLES.STUDENT), reopenStudentComplaint);

export default router;


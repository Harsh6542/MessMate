import express from 'express';
import {
  getAnnouncements,
  createAnnouncement,
  deactivateAnnouncement
} from '../controllers/announcementController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getAnnouncements);
router.post(
  '/',
  authorize(ROLES.MESS_MANAGER, ROLES.WARDEN, ROLES.ADMIN),
  createAnnouncement
);
router.delete(
  '/:id',
  authorize(ROLES.MESS_MANAGER, ROLES.WARDEN, ROLES.ADMIN),
  deactivateAnnouncement
);

export default router;


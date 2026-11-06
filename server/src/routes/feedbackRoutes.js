import express from 'express';
import {
  submitFeedback,
  getMyFeedback,
  getSessionFeedback,
  respondToFeedback
} from '../controllers/feedbackController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(authenticate);

router.post('/', authorize(ROLES.STUDENT), submitFeedback);
router.get('/my', authorize(ROLES.STUDENT), getMyFeedback);
router.get(
  '/session/:sessionId',
  authorize(ROLES.MESS_MANAGER, ROLES.WARDEN, ROLES.ADMIN),
  getSessionFeedback
);
router.post(
  '/:id/response',
  authorize(ROLES.MESS_MANAGER, ROLES.ADMIN),
  respondToFeedback
);

export default router;

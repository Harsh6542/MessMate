import express from 'express';
import {
  createGuestMealRequest,
  getMyGuestRequests,
  cancelGuestRequest,
  getAllGuestRequests,
  processGuestDecision
} from '../controllers/guestMealController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(authenticate);

router
  .route('/')
  .get(authorize(ROLES.MESS_MANAGER, ROLES.ADMIN), getAllGuestRequests)
  .post(authorize(ROLES.STUDENT), createGuestMealRequest);

router.get('/my', authorize(ROLES.STUDENT), getMyGuestRequests);
router.delete('/:id', authorize(ROLES.STUDENT), cancelGuestRequest);

router.put(
  '/:id/decision',
  authorize(ROLES.MESS_MANAGER, ROLES.ADMIN),
  processGuestDecision
);

export default router;

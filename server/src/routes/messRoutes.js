import express from 'express';
import {
  getMessFacilities,
  getMessFacilityById,
  createMessFacility,
  updateMessTimings
} from '../controllers/messController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getMessFacilities);
router.get('/:id', getMessFacilityById);
router.post('/', authorize(ROLES.ADMIN), createMessFacility);
router.put('/:id/timings', authorize(ROLES.ADMIN, ROLES.MESS_MANAGER), updateMessTimings);

export default router;


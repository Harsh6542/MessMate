import express from 'express';
import {
  getHostels,
  getHostelById,
  createHostel,
  updateHostel
} from '../controllers/hostelController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { restrictInDemoMode } from '../middleware/demoGuard.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.get('/', getHostels); // Public/Accessible for registration dropdowns
router.get('/:id', authenticate, getHostelById);
router.post('/', authenticate, authorize(ROLES.ADMIN), restrictInDemoMode('Creating hostel infrastructure'), createHostel);
router.put('/:id', authenticate, authorize(ROLES.ADMIN), restrictInDemoMode('Modifying hostel infrastructure'), updateHostel);

export default router;


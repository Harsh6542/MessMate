import express from 'express';
import {
  getCurrentSession,
  getTodaySessions
} from '../controllers/mealSessionController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/current', getCurrentSession);
router.get('/today', getTodaySessions);

export default router;

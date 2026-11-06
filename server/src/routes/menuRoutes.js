import express from 'express';
import {
  getTodayMenu,
  getWeeklyMenu,
  upsertMenu
} from '../controllers/menuController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(authenticate);

router.get('/today', getTodayMenu);
router.get('/weekly', getWeeklyMenu);
router.post('/', authorize(ROLES.MESS_MANAGER, ROLES.ADMIN), upsertMenu);

export default router;

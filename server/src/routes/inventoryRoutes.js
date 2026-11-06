import express from 'express';
import {
  createItem,
  getItems,
  getItem,
  updateItem,
  recordTransaction,
  getTransactions,
  getAlerts
} from '../controllers/inventoryController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(authenticate);

router
  .route('/')
  .get(authorize(ROLES.MESS_MANAGER, ROLES.MESS_STAFF, ROLES.WARDEN, ROLES.ADMIN), getItems)
  .post(authorize(ROLES.MESS_MANAGER, ROLES.ADMIN), createItem);

router.get(
  '/alerts',
  authorize(ROLES.MESS_MANAGER, ROLES.WARDEN, ROLES.ADMIN),
  getAlerts
);

router
  .route('/transactions')
  .get(authorize(ROLES.MESS_MANAGER, ROLES.WARDEN, ROLES.ADMIN), getTransactions)
  .post(authorize(ROLES.MESS_MANAGER, ROLES.MESS_STAFF, ROLES.ADMIN), recordTransaction);

router
  .route('/:id')
  .get(authorize(ROLES.MESS_MANAGER, ROLES.MESS_STAFF, ROLES.WARDEN, ROLES.ADMIN), getItem)
  .put(authorize(ROLES.MESS_MANAGER, ROLES.ADMIN), updateItem);

export default router;

import express from 'express';
import {
  getUsers,
  createUser,
  updateUserStatus,
  updateUser,
  deleteUser,
  cleanDummyUsersController
} from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { restrictInDemoMode } from '../middleware/demoGuard.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(authenticate);

router.get('/', authorize(ROLES.ADMIN), getUsers);
router.post('/', authorize(ROLES.ADMIN), restrictInDemoMode('Creating user accounts or allocating staff credentials'), createUser);
router.post('/clean-dummy-users', authorize(ROLES.ADMIN), restrictInDemoMode('Purging database records'), cleanDummyUsersController);
router.put('/:id/status', authorize(ROLES.ADMIN), updateUserStatus);
router.put('/:id', authorize(ROLES.ADMIN), updateUser);
router.delete('/:id', authorize(ROLES.ADMIN), restrictInDemoMode('Deleting user accounts'), deleteUser);

export default router;

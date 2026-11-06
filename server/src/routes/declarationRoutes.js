import express from 'express';
import {
  createDeclaration,
  createBulkDeclaration,
  getMyDeclarations,
  cancelMyDeclaration
} from '../controllers/declarationController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(authenticate);

router.post('/', authorize(ROLES.STUDENT), createDeclaration);
router.post('/bulk', authorize(ROLES.STUDENT), createBulkDeclaration);
router.get('/my', authorize(ROLES.STUDENT), getMyDeclarations);
router.delete('/:id', authorize(ROLES.STUDENT), cancelMyDeclaration);

export default router;

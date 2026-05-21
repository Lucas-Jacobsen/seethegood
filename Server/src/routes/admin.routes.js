import express from 'express';
import {
  createAdminIssue,
  getAdminIssue,
  listAdminIssues,
  updateAdminIssue,
} from '../controllers/admin.controller.js';
import { requireAdminKey } from '../middleware/requireAdminKey.js';

const router = express.Router();

router.use(requireAdminKey);

router.get('/issues', listAdminIssues);
router.get('/issues/:id', getAdminIssue);
router.post('/issues', createAdminIssue);
router.put('/issues/:id', updateAdminIssue);

export default router;
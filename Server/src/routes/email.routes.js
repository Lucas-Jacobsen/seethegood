import express from 'express';
import {
  sendIssueTestEmail,
  sendTestEmail,
} from '../controllers/email.controller.js';
import { requireAdminKey } from '../middleware/requireAdminKey.js';

const router = express.Router();

router.use(requireAdminKey);

router.post('/test', sendTestEmail);
router.post('/test-issue/:id', sendIssueTestEmail);

export default router;
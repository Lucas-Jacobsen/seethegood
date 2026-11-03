import express from 'express';
import {
  sendIssueTestEmail,
  getIssueDeliveryStatus,
  sendIssueToSubscribers,
  sendTestEmail,
} from '../controllers/email.controller.js';
import { requireAdminKey } from '../middleware/requireAdminKey.js';

const router = express.Router();

router.use(requireAdminKey);

router.post('/test', sendTestEmail);
router.post('/test-issue/:id', sendIssueTestEmail);
router.post('/send-issue/:id', sendIssueToSubscribers);
router.get('/delivery-status/:id', getIssueDeliveryStatus);

export default router;
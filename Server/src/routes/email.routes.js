import express from 'express';
import { sendTestEmail } from '../controllers/email.controller.js';
import { requireAdminKey } from '../middleware/requireAdminKey.js';

const router = express.Router();

router.use(requireAdminKey);

router.post('/test', sendTestEmail);

export default router;
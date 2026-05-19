import express from 'express';
import { createAdminIssue } from '../controllers/admin.controller.js';
import { requireAdminKey } from '../middleware/requireAdminKey.js';

const router = express.Router();

router.post('/issues', requireAdminKey, createAdminIssue);

export default router;
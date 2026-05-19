import express from 'express';
import { getIssue, listIssues } from '../controllers/issue.controller.js';

const router = express.Router();

router.get('/', listIssues);
router.get('/:slug', getIssue);

export default router;
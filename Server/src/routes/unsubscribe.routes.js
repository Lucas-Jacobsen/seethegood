import express from 'express';
import { unsubscribe } from '../controllers/unsubscribe.controller.js';

const router = express.Router();

router.get('/:token', unsubscribe);

export default router;
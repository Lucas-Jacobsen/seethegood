import express from 'express';
import {
  showUnsubscribeConfirmation,
  unsubscribe,
} from '../controllers/unsubscribe.controller.js';

const router = express.Router();

router.get('/:token', showUnsubscribeConfirmation);
router.post('/:token', unsubscribe);

export default router;

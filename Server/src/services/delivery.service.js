import prisma from '../db/prisma.js';
import { buildIssueEmailPayload, sendPreparedIssueEmail } from './email.service.js';
import { createDeliveryService } from './deliveryCore.js';

// Real dependencies for the application; tests inject an in-memory database
// and a fake provider through createDeliveryService instead.
export const {
  startDeliveryBatch,
  getDeliverySummary,
  processDeliveryChunk,
} = createDeliveryService({ prisma, buildIssueEmailPayload, sendPreparedIssueEmail });

import crypto from 'crypto';
import prisma from '../db/prisma.js';

export async function addSubscriber(email) {
  const normalizedEmail = email.trim().toLowerCase();

  const existingSubscriber = await prisma.subscriber.findUnique({
    where: {
      email: normalizedEmail,
    },
  });

  if (existingSubscriber) {
    return {
      alreadySubscribed: true,
      subscriber: existingSubscriber,
    };
  }

  const subscriber = await prisma.subscriber.create({
    data: {
      email: normalizedEmail,
      status: 'ACTIVE',
      source: 'website',
      unsubscribeToken: crypto.randomUUID(),
    },
  });

  return {
    alreadySubscribed: false,
    subscriber,
  };
}

export async function getSubscribers() {
  return prisma.subscriber.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });
}
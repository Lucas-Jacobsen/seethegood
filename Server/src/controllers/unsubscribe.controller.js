import prisma from '../db/prisma.js';

export async function unsubscribe(req, res, next) {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        message: 'Unsubscribe token is required.',
      });
    }

    const subscriber = await prisma.subscriber.findUnique({
      where: {
        unsubscribeToken: token,
      },
    });

    if (!subscriber) {
      return res.status(404).json({
        message: 'Invalid or expired unsubscribe link.',
      });
    }

    await prisma.subscriber.update({
      where: {
        unsubscribeToken: token,
      },
      data: {
        status: 'UNSUBSCRIBED',
      },
    });

    return res.status(200).json({
      message: 'You have been unsubscribed from See the Good.',
    });
  } catch (error) {
    next(error);
  }
}
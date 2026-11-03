import { validateEmail } from '../utils/validateEmail.js';
import { addSubscriber } from '../services/subscriber.service.js';
import { SUBSCRIBE_SUCCESS_MESSAGE } from '../utils/publicResponses.js';

export async function subscribe(req, res, next) {
  try {
    const email = req.body?.email;

    if (typeof email !== 'string' || !validateEmail(email)) {
      return res.status(400).json({
        message: 'Please enter a valid email address.',
      });
    }

    await addSubscriber(email);

    return res.status(200).json({
      message: SUBSCRIBE_SUCCESS_MESSAGE,
    });
  } catch (error) {
    next(error);
  }
}

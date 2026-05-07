import { validateEmail } from '../utils/validateEmail.js';
import { addSubscriber } from '../services/subscriber.service.js';

export async function subscribe(req, res, next) {
  try {
    const { email } = req.body;

    if (!email || !validateEmail(email)) {
      return res.status(400).json({
        message: 'Please enter a valid email address.',
      });
    }

    const result = await addSubscriber(email);

    if (result.alreadySubscribed) {
      return res.status(200).json({
        message: 'You are already subscribed. Glad you are here.',
        subscriber: result.subscriber,
      });
    }

    return res.status(201).json({
      message: 'You are on the list. More good is coming.',
      subscriber: result.subscriber,
    });
  } catch (error) {
    next(error);
  }
}
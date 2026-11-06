import { Notification } from '../models/Notification.js';
import { emitToUser } from '../sockets/index.js';

/**
 * Create a persistent notification and push it in real-time via Socket.IO
 */
export const createNotification = async ({
  recipient,
  type,
  title,
  message,
  actionUrl = null,
  metadata = {}
}) => {
  try {
    const notification = await Notification.create({
      recipient,
      type,
      title,
      message,
      actionUrl,
      metadata
    });

    // Real-time emission
    emitToUser(recipient, 'notification:new', notification);

    return notification;
  } catch (error) {
    console.error('[Notification Service Error]', error.message);
    return null;
  }
};


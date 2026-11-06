import { Notification } from '../models/Notification.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// @desc    Get user's notifications
// @route   GET /api/v1/notifications
// @access  Authenticated
export const getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id })
    .sort({ createdAt: -1 })
    .limit(30);

  res.status(200).json({
    success: true,
    data: {
      notifications
    }
  });
});

// @desc    Get unread notifications count
// @route   GET /api/v1/notifications/unread-count
// @access  Authenticated
export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    recipient: req.user._id,
    isRead: false
  });

  res.status(200).json({
    success: true,
    data: {
      count
    }
  });
});

// @desc    Mark notification as read
// @route   PUT /api/v1/notifications/:id/read
// @access  Authenticated
export const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { isRead: true, readAt: new Date() },
    { new: true }
  );

  res.status(200).json({
    success: true,
    data: {
      notification
    }
  });
});

// @desc    Mark all notifications as read
// @route   PUT /api/v1/notifications/read-all
// @access  Authenticated
export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read.'
  });
});

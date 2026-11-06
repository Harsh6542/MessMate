import { Announcement } from '../models/Announcement.js';
import { MessFacility } from '../models/MessFacility.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { emitToRoom } from '../sockets/index.js';

// @desc    Get all active announcements for user's context
// @route   GET /api/v1/announcements
// @access  Authenticated
export const getAnnouncements = asyncHandler(async (req, res) => {
  const query = { isActive: true };

  // Filter by role if set on announcement
  query.$or = [{ targetRoles: { $size: 0 } }, { targetRoles: req.user.role }];

  const announcements = await Announcement.find(query)
    .populate('publishedBy', 'firstName lastName role')
    .sort({ priority: -1, publishedAt: -1 })
    .limit(20);

  res.status(200).json({
    success: true,
    data: {
      announcements
    }
  });
});

// @desc    Publish new announcement
// @route   POST /api/v1/announcements
// @access  Mess Manager, Warden, Admin
export const createAnnouncement = asyncHandler(async (req, res) => {
  const { title, content, priority, targetRoles, expiresAt, messId, hostelId } = req.body;

  const announcement = await Announcement.create({
    title,
    content,
    priority: priority || 'normal',
    targetRoles: targetRoles || [],
    publishedBy: req.user._id,
    mess: messId || req.user.mess || null,
    hostel: hostelId || req.user.hostel || null,
    expiresAt: expiresAt || null
  });

  // Broadcast to appropriate room via Socket.IO
  if (announcement.mess) {
    emitToRoom(`mess:${announcement.mess.toString()}`, 'announcement:new', announcement);
  } else if (announcement.hostel) {
    emitToRoom(`hostel:${announcement.hostel.toString()}`, 'announcement:new', announcement);
  } else {
    emitToRoom('role:student', 'announcement:new', announcement);
  }

  res.status(201).json({
    success: true,
    message: 'Announcement published successfully.',
    data: {
      announcement
    }
  });
});

// @desc    Deactivate announcement
// @route   DELETE /api/v1/announcements/:id
// @access  Mess Manager, Warden, Admin
export const deactivateAnnouncement = asyncHandler(async (req, res, next) => {
  const announcement = await Announcement.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );

  if (!announcement) {
    return next(new AppError('Announcement not found.', 404, 'NOT_FOUND'));
  }

  res.status(200).json({
    success: true,
    message: 'Announcement removed.',
    data: {
      announcement
    }
  });
});


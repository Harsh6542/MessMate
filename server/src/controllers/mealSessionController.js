import { MealSession } from '../models/MealSession.js';
import { MessFacility } from '../models/MessFacility.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import {
  getCurrentOrNextMealSession,
  ensureDailySessions,
  normalizeDate
} from '../services/mealSessionService.js';

// @desc    Get currently active or next upcoming meal session
// @route   GET /api/v1/meal-sessions/current
// @access  Authenticated
export const getCurrentSession = asyncHandler(async (req, res, next) => {
  const messId = req.query.messId || req.user.mess || (await MessFacility.findOne({ hostel: req.user.hostel }))?._id;

  if (!messId) {
    return next(new AppError('No mess facility mapped to user profile.', 400, 'NO_MESS_FOUND'));
  }

  const { session, isActive } = await getCurrentOrNextMealSession(messId);

  res.status(200).json({
    success: true,
    data: {
      session,
      isActive
    }
  });
});

// @desc    Get all 3 sessions for today (breakfast, lunch, dinner)
// @route   GET /api/v1/meal-sessions/today
// @access  Authenticated
export const getTodaySessions = asyncHandler(async (req, res, next) => {
  const messId = req.query.messId || req.user.mess || (await MessFacility.findOne({ hostel: req.user.hostel }))?._id;

  if (!messId) {
    return next(new AppError('No mess facility mapped to user profile.', 400, 'NO_MESS_FOUND'));
  }

  const sessions = await ensureDailySessions(messId, new Date());

  res.status(200).json({
    success: true,
    data: {
      sessions
    }
  });
});


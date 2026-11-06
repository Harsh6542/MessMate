import { Menu } from '../models/Menu.js';
import { MessFacility } from '../models/MessFacility.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { MEAL_TYPES } from '../config/constants.js';

// @desc    Get today's menu for authenticated user's mess
// @route   GET /api/v1/menus/today
// @access  Authenticated
export const getTodayMenu = asyncHandler(async (req, res, next) => {
  const messId = req.query.messId || req.user.mess || (await MessFacility.findOne({ hostel: req.user.hostel }))?._id;

  if (!messId) {
    return next(new AppError('No mess facility mapped to user profile.', 400, 'NO_MESS_FOUND'));
  }

  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ...

  const menus = await Menu.find({
    mess: messId,
    dayOfWeek,
    isSpecial: false
  });

  // Group by mealType
  const grouped = {
    breakfast: null,
    lunch: null,
    dinner: null
  };

  menus.forEach((m) => {
    grouped[m.mealType] = m;
  });

  res.status(200).json({
    success: true,
    data: {
      dayOfWeek,
      menu: grouped
    }
  });
});

// @desc    Get complete 7-day weekly menu for a mess
// @route   GET /api/v1/menus/weekly
// @access  Authenticated
export const getWeeklyMenu = asyncHandler(async (req, res, next) => {
  const messId = req.query.messId || req.user.mess || (await MessFacility.findOne({ hostel: req.user.hostel }))?._id;

  if (!messId) {
    return next(new AppError('No mess facility mapped to user profile.', 400, 'NO_MESS_FOUND'));
  }

  const menus = await Menu.find({
    mess: messId,
    isSpecial: false
  }).sort({ dayOfWeek: 1 });

  res.status(200).json({
    success: true,
    data: {
      menus
    }
  });
});

// @desc    Create or update menu for a specific day and mealType
// @route   POST /api/v1/menus
// @access  Mess Manager, Admin
export const upsertMenu = asyncHandler(async (req, res, next) => {
  const { messId, dayOfWeek, mealType, dishes, isSpecial, specialDate, specialMealName } = req.body;

  const targetMessId = messId || req.user.mess;
  if (!targetMessId) {
    return next(new AppError('Target mess facility is required.', 400, 'MESS_REQUIRED'));
  }

  const menu = await Menu.findOneAndUpdate(
    {
      mess: targetMessId,
      dayOfWeek,
      mealType,
      isSpecial: !!isSpecial
    },
    {
      $set: {
        dishes: dishes || [],
        specialDate: specialDate || null,
        specialMealName: specialMealName || null,
        createdBy: req.user._id,
        publishedAt: new Date()
      }
    },
    {
      new: true,
      upsert: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    message: 'Menu updated successfully',
    data: {
      menu
    }
  });
});


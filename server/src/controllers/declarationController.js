import { MealDeclaration } from '../models/MealDeclaration.js';
import { MessFacility } from '../models/MessFacility.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import {
  declareSingleMeal,
  declareBulkAbsence,
  cancelDeclaration
} from '../services/declarationService.js';
import { DECLARATION_STATUS } from '../config/constants.js';

// @desc    Declare absence for single meal
// @route   POST /api/v1/declarations
// @access  Student
export const createDeclaration = asyncHandler(async (req, res, next) => {
  const { date, mealType, reason } = req.body;

  const messId = req.user.mess || (await MessFacility.findOne({ hostel: req.user.hostel }))?._id;
  if (!messId) {
    return next(new AppError('No mess facility mapped to user account.', 400, 'NO_MESS_FOUND'));
  }

  const declaration = await declareSingleMeal({
    studentId: req.user._id,
    messId,
    date,
    mealType,
    reason
  });

  res.status(201).json({
    success: true,
    message: `Absence declared for ${mealType} on ${new Date(date).toDateString()}.`,
    data: {
      declaration
    }
  });
});

// @desc    Declare bulk absence for date range (leave)
// @route   POST /api/v1/declarations/bulk
// @access  Student
export const createBulkDeclaration = asyncHandler(async (req, res, next) => {
  const { startDate, endDate, mealTypes, reason } = req.body;

  const messId = req.user.mess || (await MessFacility.findOne({ hostel: req.user.hostel }))?._id;
  if (!messId) {
    return next(new AppError('No mess facility mapped to user account.', 400, 'NO_MESS_FOUND'));
  }

  const result = await declareBulkAbsence({
    studentId: req.user._id,
    messId,
    startDate,
    endDate,
    mealTypes,
    reason
  });

  res.status(201).json({
    success: true,
    message: `Declared absence across date range (${result.totalDeclared} meals recorded).`,
    data: result
  });
});

// @desc    Get my upcoming & active declarations
// @route   GET /api/v1/declarations/my
// @access  Student
export const getMyDeclarations = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const declarations = await MealDeclaration.find({
    student: req.user._id,
    date: { $gte: today },
    status: DECLARATION_STATUS.DECLARED
  }).sort({ date: 1, mealType: 1 });

  res.status(200).json({
    success: true,
    data: {
      declarations
    }
  });
});

// @desc    Cancel a declaration and restore meal eligibility
// @route   DELETE /api/v1/declarations/:id
// @access  Student
export const cancelMyDeclaration = asyncHandler(async (req, res) => {
  const declaration = await cancelDeclaration(req.params.id, req.user._id);

  res.status(200).json({
    success: true,
    message: 'Absence cancelled. Meal eligibility has been restored.',
    data: {
      declaration
    }
  });
});

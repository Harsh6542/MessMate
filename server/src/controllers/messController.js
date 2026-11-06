import { MessFacility } from '../models/MessFacility.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// @desc    Get all active mess facilities
// @route   GET /api/v1/mess
// @access  Authenticated
export const getMessFacilities = asyncHandler(async (req, res) => {
  const facilities = await MessFacility.find({ isActive: true })
    .populate('hostel', 'name code')
    .populate('manager', 'firstName lastName email phone');

  res.status(200).json({
    success: true,
    data: {
      facilities
    }
  });
});

// @desc    Get single mess facility
// @route   GET /api/v1/mess/:id
// @access  Authenticated
export const getMessFacilityById = asyncHandler(async (req, res, next) => {
  const facility = await MessFacility.findById(req.params.id)
    .populate('hostel', 'name code capacity address')
    .populate('manager', 'firstName lastName email phone');

  if (!facility) {
    return next(new AppError('Mess facility not found', 404, 'NOT_FOUND'));
  }

  res.status(200).json({
    success: true,
    data: {
      facility
    }
  });
});

// @desc    Create new mess facility
// @route   POST /api/v1/mess
// @access  Admin
export const createMessFacility = asyncHandler(async (req, res) => {
  const { name, hostel, manager, mealTimings, declarationCutoffs, billingPolicy } = req.body;

  const facility = await MessFacility.create({
    name,
    hostel,
    manager: manager || null,
    mealTimings,
    declarationCutoffs,
    billingPolicy
  });

  res.status(201).json({
    success: true,
    message: 'Mess facility created successfully',
    data: {
      facility
    }
  });
});

// @desc    Update mess meal timings & cutoffs
// @route   PUT /api/v1/mess/:id/timings
// @access  Admin, Mess Manager
export const updateMessTimings = asyncHandler(async (req, res, next) => {
  const { mealTimings, declarationCutoffs } = req.body;

  const facility = await MessFacility.findById(req.params.id);
  if (!facility) {
    return next(new AppError('Mess facility not found', 404, 'NOT_FOUND'));
  }

  if (mealTimings) facility.mealTimings = { ...facility.mealTimings, ...mealTimings };
  if (declarationCutoffs) facility.declarationCutoffs = { ...facility.declarationCutoffs, ...declarationCutoffs };

  await facility.save();

  res.status(200).json({
    success: true,
    message: 'Mess timings & cutoffs updated successfully',
    data: {
      facility
    }
  });
});


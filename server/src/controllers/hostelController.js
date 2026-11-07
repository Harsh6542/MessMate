import { Hostel } from '../models/Hostel.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// @desc    Get all active hostels
// @route   GET /api/v1/hostels
// @access  Public / Authenticated
export const getHostels = asyncHandler(async (req, res) => {
  const query = { isActive: true };
  if (req.query.type) {
    query.type = req.query.type;
  }
  const hostels = await Hostel.find(query).populate('warden', 'firstName lastName email');

  res.status(200).json({
    success: true,
    data: {
      hostels
    }
  });
});

// @desc    Get single hostel details
// @route   GET /api/v1/hostels/:id
// @access  Authenticated
export const getHostelById = asyncHandler(async (req, res, next) => {
  const hostel = await Hostel.findById(req.params.id).populate('warden', 'firstName lastName email phone');

  if (!hostel) {
    return next(new AppError('Hostel not found', 404, 'NOT_FOUND'));
  }

  res.status(200).json({
    success: true,
    data: {
      hostel
    }
  });
});

// @desc    Create new hostel
// @route   POST /api/v1/hostels
// @access  Admin
export const createHostel = asyncHandler(async (req, res, next) => {
  const { name, code, address, capacity, warden, type } = req.body;

  const existingCode = await Hostel.findOne({ code: code.toUpperCase() });
  if (existingCode) {
    return next(new AppError('A hostel with this code already exists.', 409, 'HOSTEL_CODE_EXISTS'));
  }

  const hostel = await Hostel.create({
    name,
    code: code.toUpperCase(),
    address,
    capacity,
    warden: warden || null,
    type: type || 'boys'
  });

  res.status(201).json({
    success: true,
    message: 'Hostel created successfully',
    data: {
      hostel
    }
  });
});

// @desc    Update hostel
// @route   PUT /api/v1/hostels/:id
// @access  Admin
export const updateHostel = asyncHandler(async (req, res, next) => {
  const hostel = await Hostel.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!hostel) {
    return next(new AppError('Hostel not found', 404, 'NOT_FOUND'));
  }

  res.status(200).json({
    success: true,
    message: 'Hostel updated successfully',
    data: {
      hostel
    }
  });
});


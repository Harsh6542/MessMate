import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ROLES } from '../config/constants.js';

// @desc    List all users with filters & pagination
// @route   GET /api/v1/users
// @access  Admin, Warden
export const getUsers = asyncHandler(async (req, res) => {
  const { role, hostel, mess, search, page = 1, limit = 20 } = req.query;

  const query = {};
  if (role) query.role = role;
  if (hostel) query.hostel = hostel;
  if (mess) query.mess = mess;

  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { rollNumber: { $regex: search, $options: 'i' } }
    ];
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .populate('hostel', 'name code')
    .populate('mess', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  res.status(200).json({
    success: true,
    data: {
      users
    },
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }
  });
});

// @desc    Create staff/manager/warden/admin user
// @route   POST /api/v1/users
// @access  Admin
export const createUser = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, email, password, role, hostel, mess, phone } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('User with this email already exists', 409, 'EMAIL_EXISTS'));
  }

  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    role: role || ROLES.STUDENT,
    hostel: hostel || null,
    mess: mess || null,
    phone
  });

  user.password = undefined;

  res.status(201).json({
    success: true,
    message: `Account created successfully with role '${user.role}'`,
    data: {
      user
    }
  });
});

// @desc    Update user status (activate / deactivate)
// @route   PUT /api/v1/users/:id/status
// @access  Admin
export const updateUserStatus = asyncHandler(async (req, res, next) => {
  const { isActive } = req.body;

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive },
    { new: true }
  );

  if (!user) {
    return next(new AppError('User not found', 404, 'NOT_FOUND'));
  }

  res.status(200).json({
    success: true,
    message: `User account ${user.isActive ? 'activated' : 'deactivated'} successfully`,
    data: {
      user
    }
  });
});


// @desc    Update user details (role, hostel, mess, roomNumber, phone)
// @route   PUT /api/v1/users/:id
// @access  Admin
export const updateUser = asyncHandler(async (req, res, next) => {
  const allowed = ['firstName', 'lastName', 'role', 'hostel', 'mess', 'roomNumber', 'phone', 'dietaryPreference'];
  const updates = {};
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) {
      updates[key] = req.body[key];
    }
  });

  const user = await User.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true, runValidators: true }
  ).populate('hostel', 'name code').populate('mess', 'name');

  if (!user) {
    return next(new AppError('User not found', 404, 'NOT_FOUND'));
  }

  res.status(200).json({
    success: true,
    message: 'User account updated successfully',
    data: {
      user
    }
  });
});

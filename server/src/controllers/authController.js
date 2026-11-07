import { User } from '../models/User.js';
import { MessFacility } from '../models/MessFacility.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ROLES } from '../config/constants.js';

// Helper to set HTTP-only cookie and send JSON response
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = user.generateAuthToken();

  const cookieOptions = {
    expires: new Date(
      Date.now() + (parseInt(process.env.JWT_COOKIE_EXPIRES_IN, 10) || 7) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  };

  res.cookie('messmate_jwt', token, cookieOptions);

  // Strip password from returned user object
  user.password = undefined;

  res.status(statusCode).json({
    success: true,
    message,
    token, // Provided for testing and clients that prefer header auth
    data: {
      user
    }
  });
};

// @desc    Register a new student
// @route   POST /api/v1/auth/register
// @access  Public
export const register = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, email, password, rollNumber, phone, hostel, gender, roomNumber } = req.body;

  // Check if email already in use
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(
      new AppError('An account with this email address already exists.', 409, 'EMAIL_EXISTS')
    );
  }

  // Check roll number uniqueness if provided
  if (rollNumber) {
    const existingRoll = await User.findOne({ rollNumber: rollNumber.toUpperCase() });
    if (existingRoll) {
      return next(
        new AppError('A student with this roll number is already registered.', 409, 'ROLL_NUMBER_EXISTS')
      );
    }
  }

  // Automatically link student to the corresponding Mess Facility of their chosen hostel
  let messId = null;
  if (hostel) {
    const messFacility = await MessFacility.findOne({ hostel, isActive: true });
    if (messFacility) {
      messId = messFacility._id;
    }
  }

  // Students are the default self-registration role
  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    role: ROLES.STUDENT,
    rollNumber: rollNumber ? rollNumber.toUpperCase() : undefined,
    phone,
    gender: ['male', 'female', 'other'].includes(gender?.toLowerCase()) ? gender.toLowerCase() : 'male',
    roomNumber: roomNumber ? roomNumber.trim() : '',
    hostel: hostel || null,
    mess: messId,
    lastLogin: new Date()
  });

  sendTokenResponse(user, 201, res, 'Registration successful. Welcome to MessMate!');
});

// @desc    Login user with email & password
// @route   POST /api/v1/auth/login
// @access  Public
export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Explicitly query password since select: false
  const user = await User.findOne({ email }).select('+password').populate('hostel mess');

  if (!user) {
    return next(new AppError('Invalid email address or password.', 401, 'INVALID_CREDENTIALS'));
  }

  if (!user.isActive) {
    return next(
      new AppError('This account has been deactivated. Please contact hostel admin.', 403, 'ACCOUNT_DEACTIVATED')
    );
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return next(new AppError('Invalid email address or password.', 401, 'INVALID_CREDENTIALS'));
  }

  // Update last login timestamp
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res, `Welcome back, ${user.firstName}!`);
});

// @desc    Logout user & clear cookie
// @route   POST /api/v1/auth/logout
// @access  Authenticated
export const logout = asyncHandler(async (req, res) => {
  res.cookie('messmate_jwt', 'logged_out', {
    expires: new Date(Date.now() + 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully.'
  });
});

// @desc    Get currently logged in user context
// @route   GET /api/v1/auth/me
// @access  Authenticated
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('hostel mess');

  res.status(200).json({
    success: true,
    data: {
      user
    }
  });
});

// @desc    Update user profile
// @route   PUT /api/v1/auth/profile
// @access  Authenticated
export const updateProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, phone, avatarUrl, gender, roomNumber } = req.body;

  const user = await User.findById(req.user._id);

  if (firstName) user.firstName = firstName.trim();
  if (lastName) user.lastName = lastName.trim();
  if (phone !== undefined) user.phone = phone.trim();
  if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
  if (gender && ['male', 'female', 'other'].includes(gender.toLowerCase())) {
    user.gender = gender.toLowerCase();
  }
  if (roomNumber !== undefined) user.roomNumber = roomNumber.trim();

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully.',
    data: {
      user
    }
  });
});

// @desc    Change password
// @route   PUT /api/v1/auth/change-password
// @access  Authenticated
export const changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');

  const isCurrentValid = await user.comparePassword(currentPassword);
  if (!isCurrentValid) {
    return next(new AppError('Current password provided is incorrect.', 400, 'INCORRECT_PASSWORD'));
  }

  user.password = newPassword;
  await user.save();

  sendTokenResponse(user, 200, res, 'Password changed successfully.');
});


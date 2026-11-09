import crypto from 'crypto';
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
  const normalizedEmail = (email || '').trim().toLowerCase();

  // Check if email already in use
  const existingUser = await User.findOne({ email: normalizedEmail });
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
    firstName: firstName?.trim(),
    lastName: lastName?.trim(),
    email: normalizedEmail,
    password,
    role: ROLES.STUDENT,
    rollNumber: rollNumber ? rollNumber.toUpperCase() : undefined,
    phone: phone ? phone.trim() : '',
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
  const normalizedEmail = (email || '').trim().toLowerCase();

  // Explicitly query password since select: false
  const user = await User.findOne({ email: normalizedEmail }).select('+password').populate('hostel mess');

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

// @desc    Login staff or manager using Staff/Manager ID & PIN
// @route   POST /api/v1/auth/staff-login
// @access  Public
export const staffLogin = asyncHandler(async (req, res, next) => {
  const { staffId, pin, role } = req.body;
  const rawId = (staffId || '').trim();
  const cleanId = rawId.toUpperCase();
  const cleanPin = (pin || '').trim();

  // Search by staffId OR email
  const query = {
    $or: [
      { staffId: cleanId },
      { email: rawId.toLowerCase() }
    ]
  };

  if (role) {
    query.role = role;
  } else {
    query.role = { $in: [ROLES.MESS_STAFF, ROLES.MESS_MANAGER] };
  }

  const user = await User.findOne(query)
    .select('+password +staffPin')
    .populate('hostel mess');

  if (!user) {
    return next(new AppError('Invalid ID or PIN. Account not found.', 401, 'INVALID_CREDENTIALS'));
  }

  if (!user.isActive) {
    return next(
      new AppError('This staff account has been deactivated. Please contact hostel admin.', 403, 'ACCOUNT_DEACTIVATED')
    );
  }

  // Verify PIN or password
  let isValid = false;
  if (user.staffPin) {
    isValid = await user.comparePin(cleanPin);
  }
  if (!isValid && user.password) {
    isValid = await user.comparePassword(cleanPin);
  }

  if (!isValid) {
    return next(new AppError('Invalid ID or PIN.', 401, 'INVALID_CREDENTIALS'));
  }

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

// @desc    Request password reset token
// @route   POST /api/v1/auth/forgot-password
// @access  Public
export const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const normalizedEmail = (email || '').trim().toLowerCase();

  if (!normalizedEmail) {
    return next(new AppError('Please provide your registered email address.', 400, 'EMAIL_REQUIRED'));
  }

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    return next(new AppError('No account found with this email address.', 404, 'USER_NOT_FOUND'));
  }

  // Security Guard: Prevent public resetting of system administrators
  if (
    user.role === ROLES.ADMIN ||
    user.email === 'admin@messmate.edu' ||
    user.email === 'admin@nitp.ac.in'
  ) {
    return next(
      new AppError(
        'System administrator credentials cannot be reset via public reset links. Contact infrastructure security operations.',
        403,
        'ADMIN_RESET_FORBIDDEN'
      )
    );
  }

  if (!user.isActive) {
    return next(
      new AppError('This account is deactivated. Please contact hostel administration.', 403, 'ACCOUNT_DEACTIVATED')
    );
  }

  // Generate 32-byte cryptographically secure random token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Hash token and store in user document with 30-minute expiry
  user.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000);

  await user.save({ validateBeforeSave: false });

  // Direct reset URL
  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

  res.status(200).json({
    success: true,
    message: 'Password reset link generated successfully.',
    resetToken,
    resetUrl,
    data: {
      email: user.email,
      expiresInMinutes: 30
    }
  });
});

// @desc    Reset password using valid token
// @route   POST /api/v1/auth/reset-password/:token
// @access  Public
export const resetPassword = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  const { password, newPassword } = req.body;
  const targetPassword = password || newPassword;

  if (!targetPassword || targetPassword.length < 6) {
    return next(new AppError('New password must be at least 6 characters long.', 400, 'PASSWORD_TOO_SHORT'));
  }

  // Hash incoming raw token to compare with database
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) {
    return next(
      new AppError(
        'Password reset link is invalid or has expired. Please request a new one.',
        400,
        'INVALID_OR_EXPIRED_TOKEN'
      )
    );
  }

  // Set new password (pre-save hook will hash it with bcrypt salt)
  user.password = targetPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  sendTokenResponse(user, 200, res, 'Password has been reset successfully. You are now logged in!');
});



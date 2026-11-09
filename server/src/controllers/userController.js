import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ROLES } from '../config/constants.js';
import { cleanupDummyUsers, PROTECTED_EMAILS } from '../utils/cleanupDummyUsers.js';
import { isDemoUser } from '../middleware/demoGuard.js';

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
  // Demo Mode Security Guard: Block demo administrators from adding users or assigning live credentials
  if (isDemoUser(req.user, req)) {
    return next(
      new AppError(
        'Demo Security Guard: Creating live user accounts or allocating staff/manager credentials (ID & PIN) is disabled in demo mode to protect your institutional database.',
        403,
        'DEMO_CREATE_FORBIDDEN'
      )
    );
  }

  const { firstName, lastName, email, password, role, hostel, mess, phone, gender, roomNumber, staffId, staffPin } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('User with this email already exists', 409, 'EMAIL_EXISTS'));
  }

  // If staff/manager, validate or assign Staff ID and Staff PIN
  let finalStaffId = staffId ? staffId.toUpperCase().trim() : undefined;
  let finalStaffPin = staffPin ? staffPin.trim() : undefined;

  if (role === ROLES.MESS_STAFF || role === ROLES.MESS_MANAGER) {
    if (finalStaffId) {
      const existingStaff = await User.findOne({ staffId: finalStaffId });
      if (existingStaff) {
        return next(new AppError(`Staff ID '${finalStaffId}' is already assigned to another user.`, 409, 'STAFF_ID_EXISTS'));
      }
    } else {
      // Auto-generate clean Staff ID if omitted
      const prefix = role === ROLES.MESS_MANAGER ? 'MGR' : 'STF';
      const randomNum = Math.floor(200 + Math.random() * 800);
      finalStaffId = `${prefix}-${randomNum}`;
    }

    if (!finalStaffPin) {
      finalStaffPin = '1234'; // Default PIN if omitted
    }
  }

  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    role: role || ROLES.STUDENT,
    hostel: hostel || null,
    mess: mess || null,
    phone,
    gender: gender || 'male',
    roomNumber: roomNumber || '',
    staffId: finalStaffId,
    staffPin: finalStaffPin
  });

  user.password = undefined;

  res.status(201).json({
    success: true,
    message: `Account created successfully with role '${user.role}'${finalStaffId ? ` and assigned Staff ID ${finalStaffId}` : ''}.`,
    data: {
      user
    }
  });
});

// @desc    Update user status (activate / deactivate)
// @route   PUT /api/v1/users/:id/status
// @access  Admin
export const updateUserStatus = asyncHandler(async (req, res, next) => {
  const targetUser = await User.findById(req.params.id);
  if (!targetUser) {
    return next(new AppError('User not found', 404, 'NOT_FOUND'));
  }

  // Demo Mode Security Guard: Demo admin cannot deactivate or alter real user accounts
  if (isDemoUser(req.user, req) && !isDemoUser(targetUser, req)) {
    return next(
      new AppError(
        'Demo Security Guard: Demo administrators cannot deactivate or alter real institutional user accounts.',
        403,
        'DEMO_STATUS_FORBIDDEN'
      )
    );
  }

  const { isActive } = req.body;
  targetUser.isActive = isActive;
  await targetUser.save();

  res.status(200).json({
    success: true,
    message: `User account ${targetUser.isActive ? 'activated' : 'deactivated'} successfully`,
    data: {
      user: targetUser
    }
  });
});

// @desc    Update user details (role, hostel, mess, roomNumber, phone)
// @route   PUT /api/v1/users/:id
// @access  Admin
export const updateUser = asyncHandler(async (req, res, next) => {
  const targetUser = await User.findById(req.params.id);
  if (!targetUser) {
    return next(new AppError('User not found', 404, 'NOT_FOUND'));
  }

  // Demo Mode Security Guard: Demo admin cannot modify real user accounts or reassign their hostels
  if (isDemoUser(req.user, req) && !isDemoUser(targetUser, req)) {
    return next(
      new AppError(
        'Demo Security Guard: Demo administrators cannot modify real registered user accounts or reassign their hostels.',
        403,
        'DEMO_UPDATE_FORBIDDEN'
      )
    );
  }

  const allowed = ['firstName', 'lastName', 'role', 'hostel', 'mess', 'roomNumber', 'phone', 'gender', 'dietaryPreference', 'staffId', 'staffPin'];
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

  res.status(200).json({
    success: true,
    message: 'User account updated successfully',
    data: {
      user
    }
  });
});

// @desc    Delete a user account
// @route   DELETE /api/v1/users/:id
// @access  Admin
export const deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new AppError('User not found', 404, 'NOT_FOUND'));
  }

  if (user._id.toString() === req.user._id.toString()) {
    return next(new AppError('You cannot delete your own admin account', 400, 'SELF_DELETE_FORBIDDEN'));
  }

  // 1. Protected demo personas cannot be deleted
  if (PROTECTED_EMAILS.includes(user.email) || user.isDemo) {
    return next(new AppError('Protected system/demo persona cannot be deleted to ensure platform stability', 400, 'PROTECTED_ACCOUNT'));
  }

  // 2. Demo Mode Security Guard: Demo accounts are strictly prohibited from deleting real users
  if (isDemoUser(req.user, req)) {
    return next(
      new AppError(
        'Demo Security Guard: Demo administrators cannot delete real registered users or staff. Your live data is completely safe.',
        403,
        'DEMO_DELETE_FORBIDDEN'
      )
    );
  }

  await User.findByIdAndDelete(user._id);

  res.status(200).json({
    success: true,
    message: `Account for ${user.firstName} ${user.lastName} (${user.email}) deleted successfully.`
  });
});

// @desc    Purge all dummy mock students and associated records
// @route   POST /api/v1/users/clean-dummy-users
// @access  Admin
export const cleanDummyUsersController = asyncHandler(async (req, res, next) => {
  // Demo Mode Security Guard: Block demo admin from triggering database purging
  if (isDemoUser(req.user, req)) {
    return next(
      new AppError(
        'Demo Security Guard: Database cleanup/purging is disabled in demo mode to protect your data.',
        403,
        'DEMO_CLEANUP_FORBIDDEN'
      )
    );
  }

  const result = await cleanupDummyUsers();
  res.status(200).json({
    success: true,
    message: result.message,
    data: result
  });
});

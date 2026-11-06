import { Coupon } from '../models/Coupon.js';
import { MealSession } from '../models/MealSession.js';
import { MealDeclaration } from '../models/MealDeclaration.js';
import { Attendance } from '../models/Attendance.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { generateSecureToken, hashToken } from '../utils/tokenUtils.js';
import { getCurrentOrNextMealSession, normalizeDate } from './mealSessionService.js';
import { COUPON_STATUS, DECLARATION_STATUS } from '../config/constants.js';

/**
 * Generate or retrieve an active meal coupon for a student
 */
export const generateOrGetCoupon = async (studentId, messId) => {
  const student = await User.findById(studentId).populate('hostel mess');
  if (!student || !student.isActive) {
    throw new AppError('Student account is inactive or not found.', 403, 'INACTIVE_USER');
  }

  // Determine current active or upcoming meal session
  const targetMessId = messId || student.mess?._id || student.hostel?.mess;
  if (!targetMessId) {
    throw new AppError('No mess facility assigned to your profile.', 400, 'NO_MESS_ASSIGNED');
  }

  const { session } = await getCurrentOrNextMealSession(targetMessId);
  if (!session) {
    throw new AppError('No meal session available currently.', 404, 'NO_SESSION');
  }

  const normalizedSessionDate = normalizeDate(session.date);

  // 1. Check if student declared absence for this meal
  const declaration = await MealDeclaration.findOne({
    student: studentId,
    date: normalizedSessionDate,
    mealType: session.mealType,
    status: DECLARATION_STATUS.DECLARED
  });

  if (declaration) {
    throw new AppError(
      `You have declared absence for ${session.mealType} on ${normalizedSessionDate.toDateString()}. Coupon generation is disabled.`,
      403,
      'OPTED_OUT'
    );
  }

  // 2. Check if student has already attended this meal session
  const existingAttendance = await Attendance.findOne({
    student: studentId,
    mealSession: session._id
  });

  if (existingAttendance) {
    throw new AppError(
      `You have already redeemed your coupon and attended ${session.mealType} today at ${existingAttendance.timestamp.toLocaleTimeString()}.`,
      400,
      'ALREADY_ATTENDED'
    );
  }

  // 3. Check if coupon already generated for this session
  let coupon = await Coupon.findOne({
    student: studentId,
    mealSession: session._id
  }).populate('mealSession');

  if (coupon) {
    if (coupon.status === COUPON_STATUS.REDEEMED) {
      throw new AppError('This meal coupon has already been redeemed.', 400, 'COUPON_REDEEMED');
    }
    // Return existing active coupon
    return { coupon, session, isNew: false };
  }

  // 4. Generate new secure coupon
  const rawToken = generateSecureToken(32);
  const tokenHash = hashToken(rawToken);

  // Payload encoded into the QR code
  const qrPayload = JSON.stringify({
    couponId: undefined, // Will be set after creation
    token: rawToken,
    studentId: student._id,
    rollNumber: student.rollNumber,
    mealType: session.mealType,
    date: normalizedSessionDate.toISOString().split('T')[0]
  });

  coupon = await Coupon.create({
    student: studentId,
    mealSession: session._id,
    tokenHash,
    qrPayload,
    status: COUPON_STATUS.ACTIVE,
    expiresAt: session.endTime
  });

  // Re-encode with coupon ID embedded
  coupon.qrPayload = JSON.stringify({
    couponId: coupon._id,
    token: rawToken,
    studentId: student._id,
    rollNumber: student.rollNumber,
    mealType: session.mealType,
    date: normalizedSessionDate.toISOString().split('T')[0]
  });
  await coupon.save();

  await coupon.populate('mealSession');
  return { coupon, session, isNew: true };
};

/**
 * Verify and redeem QR coupon at staff counter (Atomic to prevent double-serve)
 */
export const redeemCoupon = async ({ qrData, staffId }) => {
  let parsedPayload;
  try {
    parsedPayload = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
  } catch {
    throw new AppError('Invalid QR code format.', 400, 'INVALID_QR_FORMAT');
  }

  const { token, couponId } = parsedPayload;
  if (!token) {
    throw new AppError('Malformed coupon payload: Missing authentication token.', 400, 'MALFORMED_TOKEN');
  }

  const hashedToken = hashToken(token);
  const now = new Date();

  // ATOMIC REDEMPTION: Find and update active, unexpired coupon in one database write
  const redeemedCoupon = await Coupon.findOneAndUpdate(
    {
      tokenHash: hashedToken,
      status: COUPON_STATUS.ACTIVE,
      expiresAt: { $gt: now }
    },
    {
      $set: {
        status: COUPON_STATUS.REDEEMED,
        redeemedAt: now,
        redeemedBy: staffId
      }
    },
    { new: true }
  ).populate('student', 'firstName lastName rollNumber phone hostel avatarUrl')
   .populate('mealSession');

  if (!redeemedCoupon) {
    // Investigate reason for failure to provide clear UI feedback
    const existingCoupon = await Coupon.findOne({ tokenHash: hashedToken }).populate('mealSession');
    if (!existingCoupon) {
      throw new AppError('Unrecognized or invalid coupon QR code.', 404, 'COUPON_NOT_FOUND');
    }
    if (existingCoupon.status === COUPON_STATUS.REDEEMED) {
      const redeemedTime = existingCoupon.redeemedAt?.toLocaleTimeString() || 'earlier';
      throw new AppError(
        `DUPLICATE SCAN: Coupon has already been redeemed at ${redeemedTime}.`,
        400,
        'COUPON_ALREADY_REDEEMED'
      );
    }
    if (now >= existingCoupon.expiresAt) {
      throw new AppError('EXPIRED COUPON: The meal session for this coupon has concluded.', 400, 'COUPON_EXPIRED');
    }
    throw new AppError('Coupon is no longer valid.', 400, 'INVALID_COUPON');
  }

  // Record immutable attendance record
  const attendance = await Attendance.create({
    student: redeemedCoupon.student._id,
    mealSession: redeemedCoupon.mealSession._id,
    coupon: redeemedCoupon._id,
    verificationMethod: 'qr_scan',
    verifiedBy: staffId,
    timestamp: now
  });

  // Increment actual served count on the MealSession
  await MealSession.findByIdAndUpdate(redeemedCoupon.mealSession._id, {
    $inc: { actualServedCount: 1 }
  });

  return {
    success: true,
    student: redeemedCoupon.student,
    mealSession: redeemedCoupon.mealSession,
    attendance
  };
};

/**
 * Fallback Manual Roll Number Verification by Staff
 */
export const manualVerifyStudent = async ({ rollNumber, staffId, reason }) => {
  const staff = await User.findById(staffId).populate('mess');
  if (!staff) {
    throw new AppError('Staff user not found.', 404, 'STAFF_NOT_FOUND');
  }

  const student = await User.findOne({
    rollNumber: rollNumber.trim().toUpperCase()
  }).populate('hostel mess');

  if (!student) {
    throw new AppError(`No student registered with roll number '${rollNumber}'.`, 404, 'STUDENT_NOT_FOUND');
  }

  if (!student.isActive) {
    throw new AppError('This student account is marked inactive.', 403, 'INACTIVE_STUDENT');
  }

  const targetMessId = staff.mess?._id || student.mess?._id;
  const { session } = await getCurrentOrNextMealSession(targetMessId);

  const normalizedSessionDate = normalizeDate(session.date);

  // Check if opted out
  const declaration = await MealDeclaration.findOne({
    student: student._id,
    date: normalizedSessionDate,
    mealType: session.mealType,
    status: DECLARATION_STATUS.DECLARED
  });

  if (declaration) {
    throw new AppError(
      `Student declared absence for ${session.mealType} on ${normalizedSessionDate.toDateString()}.`,
      403,
      'STUDENT_OPTED_OUT'
    );
  }

  // Check if already attended
  const existingAttendance = await Attendance.findOne({
    student: student._id,
    mealSession: session._id
  });

  if (existingAttendance) {
    throw new AppError(
      `Student has already been served ${session.mealType} today at ${existingAttendance.timestamp.toLocaleTimeString()}.`,
      400,
      'ALREADY_SERVED'
    );
  }

  // Create manual attendance entry
  const attendance = await Attendance.create({
    student: student._id,
    mealSession: session._id,
    coupon: null,
    verificationMethod: 'manual_roll_lookup',
    verifiedBy: staffId,
    manualReason: reason || 'Manual verification at staff counter',
    timestamp: new Date()
  });

  // Increment served count
  await MealSession.findByIdAndUpdate(session._id, {
    $inc: { actualServedCount: 1 }
  });

  return {
    student,
    session,
    attendance
  };
};


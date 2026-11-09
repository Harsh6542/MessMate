import { Coupon } from '../models/Coupon.js';
import { MealSession } from '../models/MealSession.js';
import { MealDeclaration } from '../models/MealDeclaration.js';
import { Attendance } from '../models/Attendance.js';
import { User } from '../models/User.js';
import { MessFacility } from '../models/MessFacility.js';
import { AppError } from '../utils/AppError.js';
import { generateSecureToken, hashToken } from '../utils/tokenUtils.js';
import { getCurrentOrNextMealSession, normalizeDate } from './mealSessionService.js';
import { COUPON_STATUS, DECLARATION_STATUS } from '../config/constants.js';
import { emitToRoom } from '../sockets/index.js';
import { isDemoUser } from '../middleware/demoGuard.js';

/**
 * Helper: Ensure student wallet defaults and synchronize calendar month allowance.
 * Every new calendar month, the student's ₹1,000 monthly allowance resets!
 */
export const checkAndSyncMonthlyWallet = async (student) => {
  const currentMonth = new Date().toISOString().slice(0, 7); // e.g. "2026-11"

  if (!student.couponWallet || typeof student.couponWallet.balanceAmount !== 'number') {
    student.couponWallet = {
      semesterTotalAmount: 6000,
      balanceAmount: 6000,
      monthlyMaxAmount: 1000,
      currentMonthAmountSpent: 0,
      lastRedemptionMonth: currentMonth
    };
  } else {
    // Reset monthly allowance when calendar month changes
    if (student.couponWallet.lastRedemptionMonth !== currentMonth) {
      student.couponWallet.currentMonthAmountSpent = 0;
      student.couponWallet.lastRedemptionMonth = currentMonth;
    }

    if (typeof student.couponWallet.semesterTotalAmount !== 'number') student.couponWallet.semesterTotalAmount = 6000;
    if (typeof student.couponWallet.balanceAmount !== 'number') student.couponWallet.balanceAmount = 6000;
    if (typeof student.couponWallet.monthlyMaxAmount !== 'number') student.couponWallet.monthlyMaxAmount = 1000;
    if (typeof student.couponWallet.currentMonthAmountSpent !== 'number') student.couponWallet.currentMonthAmountSpent = 0;
  }

  if (!student.uniqueStudentQR) {
    student.uniqueStudentQR = `MESSMATE:STUDENT:${student._id}:${student.rollNumber || 'STU'}`;
  }

  return student;
};

/**
 * Helper: Validate student semester and monthly limits for flexible payment amount (₹1 - ₹1,000)
 */
export const validateWalletAllowance = (student, requestedAmount) => {
  const wallet = student.couponWallet;
  const payAmount = Number(requestedAmount);

  if (!payAmount || isNaN(payAmount) || payAmount < 1) {
    throw new AppError('Payment amount must be at least ₹1.', 400, 'INVALID_AMOUNT');
  }

  if (payAmount > 1000) {
    throw new AppError('Single payment amount cannot exceed ₹1,000.', 400, 'EXCEEDS_MAX_PAYMENT');
  }

  // 1. Monthly Limit Check (Max ₹1,000 per month)
  const monthlyMax = wallet.monthlyMaxAmount || 1000;
  const currentSpent = wallet.currentMonthAmountSpent || 0;
  const monthlyRemaining = Math.max(0, monthlyMax - currentSpent);

  if (monthlyRemaining <= 0) {
    throw new AppError(
      'Your monthly balance of ₹1,000 has been completely used up (₹0 remaining this month). You cannot make any more payments within this month. Next month ₹1,000 will be redeemed again into your wallet.',
      403,
      'MONTHLY_LIMIT_EXHAUSTED'
    );
  }

  if (payAmount > monthlyRemaining) {
    throw new AppError(
      `Payment of ₹${payAmount} exceeds your remaining monthly allowance of ₹${monthlyRemaining}. You can pay up to ₹${monthlyRemaining} more this month.`,
      403,
      'EXCEEDS_MONTHLY_ALLOWANCE'
    );
  }

  // 2. Overall Semester Balance Check (Total ₹6,000)
  if (wallet.balanceAmount <= 0) {
    throw new AppError(
      'Your total semester wallet balance (₹6,000) is completely exhausted.',
      403,
      'SEMESTER_BALANCE_EXHAUSTED'
    );
  }

  if (payAmount > wallet.balanceAmount) {
    throw new AppError(
      `Payment of ₹${payAmount} exceeds your available semester balance of ₹${wallet.balanceAmount}.`,
      403,
      'EXCEEDS_SEMESTER_BALANCE'
    );
  }
};

/**
 * Retrieve student's coupon wallet with real-time monthly remaining and passbook
 */
export const getStudentWallet = async (studentId) => {
  const student = await User.findById(studentId).populate('hostel mess');
  if (!student || !student.isActive) {
    throw new AppError('Student profile not found or inactive.', 404, 'STUDENT_NOT_FOUND');
  }

  await checkAndSyncMonthlyWallet(student);
  await student.save();

  // Fetch recent redeemed coupon transactions for this student
  const recentTransactions = await Coupon.find({
    student: studentId,
    status: COUPON_STATUS.REDEEMED
  })
    .populate('mealSession')
    .sort({ redeemedAt: -1, createdAt: -1 })
    .limit(25);

  const wallet = student.couponWallet;
  const monthlyMax = wallet.monthlyMaxAmount || 1000;
  const currentSpent = wallet.currentMonthAmountSpent || 0;
  const monthlyRemaining = Math.max(0, monthlyMax - currentSpent);
  const effectiveAvailableThisMonth = Math.min(monthlyRemaining, wallet.balanceAmount);

  return {
    wallet: {
      semesterTotalAmount: wallet.semesterTotalAmount || 6000,
      balanceAmount: wallet.balanceAmount,
      monthlyMaxAmount: monthlyMax,
      currentMonthAmountSpent: currentSpent,
      monthlyRemaining,
      effectiveAvailableThisMonth,
      isMonthlyExhausted: monthlyRemaining <= 0,
      lastRedemptionMonth: wallet.lastRedemptionMonth,
      policyNote: 'Regular meals are 100% free (included in hostel fee). You can spend from ₹1 up to ₹1,000 per month from your ₹6,000 semester allocation.'
    },
    uniqueStudentQR: student.uniqueStudentQR,
    student: {
      id: student._id,
      name: `${student.firstName} ${student.lastName}`,
      rollNumber: student.rollNumber,
      roomNumber: student.roomNumber,
      gender: student.gender,
      hostel: student.hostel?.name || 'Not Assigned',
      mess: student.mess?.name || 'Not Assigned',
      messId: student.mess?._id
    },
    recentTransactions: recentTransactions.map((tx) => ({
      id: tx._id,
      transactionId: tx.transactionId || `TXN-${tx._id.toString().slice(-8).toUpperCase()}`,
      amount: tx.amount || 500,
      paymentMethod: tx.paymentMethod || 'student_scan_counter',
      mealType: tx.mealSession?.mealType || 'Meal',
      sessionDate: tx.mealSession?.date,
      redeemedAt: tx.redeemedAt || tx.updatedAt,
      status: tx.status
    }))
  };
};

/**
 * PhonePe / UPI-style Scan & Pay: Student pays any flexible amount (₹1 to ₹1,000)
 */
export const payCounterQR = async ({ studentId, counterQR, amount }) => {
  if (!counterQR) {
    throw new AppError('Mess Counter QR code is required.', 400, 'MISSING_QR');
  }

  const payAmount = Math.round(Number(amount));
  if (!payAmount || isNaN(payAmount) || payAmount < 1) {
    throw new AppError('Please enter a valid payment amount between ₹1 and ₹1,000.', 400, 'INVALID_AMOUNT');
  }

  // 1. Parse Mess Facility ID from Counter QR
  let messId = null;
  if (typeof counterQR === 'string') {
    if (counterQR.startsWith('MESSMATE:COUNTER:')) {
      const parts = counterQR.split(':');
      messId = parts[2];
    } else {
      try {
        const parsed = JSON.parse(counterQR);
        messId = parsed.messId || parsed.mess || parsed.id;
      } catch {
        messId = counterQR.trim();
      }
    }
  } else if (counterQR?.messId) {
    messId = counterQR.messId;
  }

  if (!messId) {
    throw new AppError('Invalid Mess Counter QR code format.', 400, 'INVALID_COUNTER_QR');
  }

  const messFacility = await MessFacility.findById(messId);
  if (!messFacility) {
    throw new AppError('Mess facility not found for the scanned QR standee.', 404, 'MESS_NOT_FOUND');
  }

  // 2. Fetch student profile and active session
  const student = await User.findById(studentId).populate('hostel mess');
  if (!student || !student.isActive) {
    throw new AppError('Student profile is inactive or not found.', 403, 'INACTIVE_STUDENT');
  }

  const { session } = await getCurrentOrNextMealSession(messFacility._id);
  if (!session) {
    throw new AppError('No active or upcoming meal session available at this mess right now.', 404, 'NO_SESSION');
  }

  // 3. Synchronize monthly wallet and validate allowances
  await checkAndSyncMonthlyWallet(student);
  validateWalletAllowance(student, payAmount);

  // 4. Atomic deduction from wallet to prevent concurrent double-spending
  const currentMonth = new Date().toISOString().slice(0, 7);
  const updatedStudent = await User.findOneAndUpdate(
    {
      _id: studentId,
      'couponWallet.balanceAmount': { $gte: payAmount }
    },
    {
      $inc: {
        'couponWallet.balanceAmount': -payAmount,
        'couponWallet.currentMonthAmountSpent': payAmount
      },
      $set: {
        'couponWallet.lastRedemptionMonth': currentMonth
      }
    },
    { new: true }
  );

  if (!updatedStudent) {
    throw new AppError('Insufficient wallet balance or concurrent payment rejected.', 400, 'INSUFFICIENT_BALANCE');
  }
  student.couponWallet = updatedStudent.couponWallet;

  // 5. Create unique transaction record
  const transactionId = `TXN-MM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const now = new Date();
  const rawToken = generateSecureToken(24);
  const tokenHash = hashToken(rawToken);

  const coupon = await Coupon.create({
    student: studentId,
    mealSession: session._id,
    tokenHash,
    qrPayload: counterQR,
    amount: payAmount,
    transactionId,
    itemType: 'special_item',
    specialItemName: `Mess Payment (₹${payAmount})`,
    paymentMethod: 'student_scan_counter',
    status: COUPON_STATUS.REDEEMED,
    redeemedAt: now,
    expiresAt: session.endTime
  });

  // 6. Record Attendance if not already attended for this session
  let attendance = await Attendance.findOne({ student: studentId, mealSession: session._id });
  if (!attendance) {
    attendance = await Attendance.create({
      student: studentId,
      mealSession: session._id,
      coupon: coupon._id,
      verificationMethod: 'qr_scan',
      verifiedBy: null,
      timestamp: now
    });

    await MealSession.findByIdAndUpdate(session._id, {
      $inc: { actualServedCount: 1 }
    });
  }

  // 7. Emit real-time payment feed to Staff Mess Counter Room
  emitToRoom(`mess:${messFacility._id.toString()}`, 'counter:payment', {
    transactionId,
    student: {
      id: student._id,
      name: `${student.firstName} ${student.lastName}`,
      rollNumber: student.rollNumber,
      roomNumber: student.roomNumber,
      hostel: student.hostel?.name || ''
    },
    mealType: session.mealType,
    amount: payAmount,
    timestamp: now
  });

  const monthlyRemaining = Math.max(0, (student.couponWallet.monthlyMaxAmount || 1000) - student.couponWallet.currentMonthAmountSpent);

  return {
    success: true,
    transactionId,
    amount: payAmount,
    paidAt: now,
    mealType: session.mealType,
    sessionDate: session.date,
    messName: messFacility.name,
    studentName: `${student.firstName} ${student.lastName}`,
    rollNumber: student.rollNumber,
    walletBalance: student.couponWallet.balanceAmount,
    monthlyRemaining,
    attendance
  };
};

/**
 * Generate or retrieve an active meal coupon for a student
 */
export const generateOrGetCoupon = async (studentId, messId) => {
  const student = await User.findById(studentId).populate('hostel mess');
  if (!student || !student.isActive) {
    throw new AppError('Student account is inactive or not found.', 403, 'INACTIVE_USER');
  }

  await checkAndSyncMonthlyWallet(student);

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
      `You have declared absence for ${session.mealType} on ${normalizedSessionDate.toDateString()}.`,
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
      `You have already attended ${session.mealType} today at ${existingAttendance.timestamp.toLocaleTimeString()}.`,
      400,
      'ALREADY_ATTENDED'
    );
  }

  // 3. Check if coupon already generated for this session
  let coupon = await Coupon.findOne({
    student: studentId,
    mealSession: session._id,
    itemType: 'regular_meal'
  }).populate('mealSession');

  if (coupon) {
    if (coupon.status === COUPON_STATUS.REDEEMED) {
      throw new AppError('This meal coupon has already been redeemed.', 400, 'COUPON_REDEEMED');
    }
    return { coupon, session, isNew: false, wallet: student.couponWallet };
  }

  // 4. Generate new regular meal pass (FREE / Covered by hostel fee, amount = 0)
  const rawToken = generateSecureToken(32);
  const tokenHash = hashToken(rawToken);

  const qrPayload = JSON.stringify({
    couponId: undefined,
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
    amount: 0,
    itemType: 'regular_meal',
    specialItemName: 'Regular Mess Meal (Included in Fees)',
    status: COUPON_STATUS.ACTIVE,
    expiresAt: session.endTime
  });

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
  return { coupon, session, isNew: true, wallet: student.couponWallet };
};

/**
 * Verify and redeem QR at staff counter
 * Supports:
 *  A) Regular Meal Entry: Student permanent QR scanned for regular daily meal (₹0, covered by fees)
 *  B) Wallet Payment: Staff enters amount (₹1 - ₹1,000) and redeems from student's wallet
 */
export const redeemCoupon = async ({ qrData, staffId, isCoupon = false, amount = 500 }) => {
  const staff = await User.findById(staffId).populate('mess');
  if (!staff) {
    throw new AppError('Staff user not found.', 404, 'STAFF_NOT_FOUND');
  }

  const rawData = typeof qrData === 'string' ? qrData.trim() : '';

  // ── BRANCH A: Permanent Unique Student QR Code (MESSMATE:STUDENT:...) ──
  if (rawData.startsWith('MESSMATE:STUDENT:')) {
    const parts = rawData.split(':');
    const studentId = parts[2];
    const rollNumber = parts[3];

    const student = await User.findOne({
      $or: [{ _id: studentId }, { rollNumber }]
    }).populate('hostel mess');

    if (!student || !student.isActive) {
      throw new AppError('Student profile not found or inactive.', 404, 'STUDENT_NOT_FOUND');
    }

    const targetMessId = staff.mess?._id || student.mess?._id;
    if (!targetMessId) {
      throw new AppError('No mess facility associated with staff or student.', 400, 'NO_MESS');
    }

    const { session } = await getCurrentOrNextMealSession(targetMessId);
    if (!session) {
      throw new AppError('No active or upcoming meal session currently.', 404, 'NO_SESSION');
    }

    const normalizedSessionDate = normalizeDate(session.date);

    // If STAFF IS REDEEMING A WALLET PAYMENT:
    if (isCoupon) {
      if (isDemoUser(staff) && !isDemoUser(student)) {
        throw new AppError(
          'Demo Mode Security: Demo staff accounts are sandboxed and cannot deduct real wallet balance from registered students.',
          403,
          'DEMO_STAFF_RESTRICTED'
        );
      }

      const payAmount = Math.round(Number(amount) || 500);
      await checkAndSyncMonthlyWallet(student);
      validateWalletAllowance(student, payAmount);

      // Atomic deduction from wallet to prevent concurrent double-spending
      const currentMonth = new Date().toISOString().slice(0, 7);
      const updatedStudent = await User.findOneAndUpdate(
        {
          _id: student._id,
          'couponWallet.balanceAmount': { $gte: payAmount }
        },
        {
          $inc: {
            'couponWallet.balanceAmount': -payAmount,
            'couponWallet.currentMonthAmountSpent': payAmount
          },
          $set: {
            'couponWallet.lastRedemptionMonth': currentMonth
          }
        },
        { new: true }
      );

      if (!updatedStudent) {
        throw new AppError('Insufficient wallet balance or concurrent payment rejected.', 400, 'INSUFFICIENT_BALANCE');
      }
      student.couponWallet = updatedStudent.couponWallet;

      const transactionId = `TXN-MM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      const now = new Date();
      const rawToken = generateSecureToken(24);
      const tokenHash = hashToken(rawToken);

      await Coupon.create({
        student: student._id,
        mealSession: session._id,
        tokenHash,
        qrPayload: rawData,
        amount: payAmount,
        transactionId,
        itemType: 'special_item',
        specialItemName: `Mess Payment (₹${payAmount})`,
        paymentMethod: 'staff_scan_student',
        status: COUPON_STATUS.REDEEMED,
        redeemedAt: now,
        redeemedBy: staffId,
        expiresAt: session.endTime
      });

      const monthlyRemaining = Math.max(0, (student.couponWallet.monthlyMaxAmount || 1000) - student.couponWallet.currentMonthAmountSpent);

      return {
        success: true,
        isCoupon: true,
        message: `Mess Payment of ₹${payAmount} Redeemed Successfully`,
        amount: payAmount,
        student,
        mealSession: session,
        wallet: {
          ...student.couponWallet.toObject(),
          monthlyRemaining
        }
      };
    }

    // DEFAULT: REGULAR DAILY MEAL ENTRY (FREE / Included in hostel fee)
    // Check if opted out
    const declaration = await MealDeclaration.findOne({
      student: student._id,
      date: normalizedSessionDate,
      mealType: session.mealType,
      status: DECLARATION_STATUS.DECLARED
    });

    if (declaration) {
      throw new AppError(`Student declared absence for ${session.mealType} today.`, 403, 'STUDENT_OPTED_OUT');
    }

    // Check if already served regular meal for this session
    const existingAttendance = await Attendance.findOne({
      student: student._id,
      mealSession: session._id
    });

    if (existingAttendance) {
      throw new AppError(
        `DUPLICATE SCAN: Student already served regular ${session.mealType} at ${existingAttendance.timestamp.toLocaleTimeString()}.`,
        400,
        'ALREADY_SERVED'
      );
    }

    // Create Attendance record (₹0 deducted from wallet)
    const attendance = await Attendance.create({
      student: student._id,
      mealSession: session._id,
      coupon: null,
      verificationMethod: 'qr_scan',
      verifiedBy: staffId,
      timestamp: new Date()
    });

    await MealSession.findByIdAndUpdate(session._id, {
      $inc: { actualServedCount: 1 }
    });

    await checkAndSyncMonthlyWallet(student);
    const monthlyRemaining = Math.max(0, (student.couponWallet.monthlyMaxAmount || 1000) - (student.couponWallet.currentMonthAmountSpent || 0));

    return {
      success: true,
      isCoupon: false,
      message: 'Regular Meal Verified (Included in Fees - ₹0 Debited)',
      student,
      mealSession: session,
      attendance,
      wallet: {
        ...student.couponWallet.toObject(),
        monthlyRemaining
      }
    };
  }

  // ── BRANCH B: Cryptographic Session QR Payload ──
  let parsedPayload;
  try {
    parsedPayload = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
  } catch {
    throw new AppError('Invalid QR code format.', 400, 'INVALID_QR_FORMAT');
  }

  const { token } = parsedPayload;
  if (!token) {
    throw new AppError('Malformed coupon payload: Missing authentication token.', 400, 'MALFORMED_TOKEN');
  }

  const hashedToken = hashToken(token);
  const now = new Date();

  const activeCoupon = await Coupon.findOne({
    tokenHash: hashedToken,
    status: COUPON_STATUS.ACTIVE,
    expiresAt: { $gt: now }
  }).populate('student mealSession');

  if (!activeCoupon) {
    const existingCoupon = await Coupon.findOne({ tokenHash: hashedToken }).populate('mealSession');
    if (!existingCoupon) {
      throw new AppError('Unrecognized or invalid coupon QR code.', 404, 'COUPON_NOT_FOUND');
    }
    if (existingCoupon.status === COUPON_STATUS.REDEEMED) {
      const redeemedTime = existingCoupon.redeemedAt?.toLocaleTimeString() || 'earlier';
      throw new AppError(`DUPLICATE SCAN: Coupon has already been redeemed at ${redeemedTime}.`, 400, 'COUPON_ALREADY_REDEEMED');
    }
    if (now >= existingCoupon.expiresAt) {
      throw new AppError('EXPIRED COUPON: The meal session for this coupon has concluded.', 400, 'COUPON_EXPIRED');
    }
    throw new AppError('Coupon is no longer valid.', 400, 'INVALID_COUPON');
  }

  const student = await User.findById(activeCoupon.student._id);
  activeCoupon.status = COUPON_STATUS.REDEEMED;
  activeCoupon.redeemedAt = now;
  activeCoupon.redeemedBy = staffId;
  await activeCoupon.save();

  const attendance = await Attendance.create({
    student: activeCoupon.student._id,
    mealSession: activeCoupon.mealSession._id,
    coupon: activeCoupon._id,
    verificationMethod: 'qr_scan',
    verifiedBy: staffId,
    timestamp: now
  });

  await MealSession.findByIdAndUpdate(activeCoupon.mealSession._id, {
    $inc: { actualServedCount: 1 }
  });

  const monthlyRemaining = Math.max(0, (student.couponWallet.monthlyMaxAmount || 1000) - (student.couponWallet.currentMonthAmountSpent || 0));

  return {
    success: true,
    isCoupon: false,
    message: 'Regular Meal Verified Successfully',
    student: activeCoupon.student,
    mealSession: activeCoupon.mealSession,
    attendance,
    wallet: {
      ...student.couponWallet.toObject(),
      monthlyRemaining
    }
  };
};

/**
 * Fallback Manual Roll Number Verification by Staff (Regular Meal - ₹0)
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

  if (isDemoUser(staff) && !isDemoUser(student)) {
    throw new AppError(
      'Demo Mode Security: Demo staff accounts cannot manually override attendance for real registered students.',
      403,
      'DEMO_STAFF_RESTRICTED'
    );
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
    throw new AppError(`Student declared absence for ${session.mealType} on ${normalizedSessionDate.toDateString()}.`, 403, 'STUDENT_OPTED_OUT');
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

  // Regular meal is FREE - NO wallet deduction
  const attendance = await Attendance.create({
    student: student._id,
    mealSession: session._id,
    coupon: null,
    verificationMethod: 'manual_roll_lookup',
    verifiedBy: staffId,
    manualReason: reason || 'Manual verification at staff counter (Regular Meal)',
    timestamp: new Date()
  });

  await MealSession.findByIdAndUpdate(session._id, {
    $inc: { actualServedCount: 1 }
  });

  await checkAndSyncMonthlyWallet(student);
  const monthlyRemaining = Math.max(0, (student.couponWallet.monthlyMaxAmount || 1000) - (student.couponWallet.currentMonthAmountSpent || 0));

  return {
    student,
    session,
    attendance,
    wallet: {
      ...student.couponWallet.toObject(),
      monthlyRemaining
    }
  };
};

/**
 * Retrieve Counter Standee QR info for Staff or Mess Manager
 */
export const getMessCounterQR = async (userId) => {
  const user = await User.findById(userId).populate('mess');
  if (!user || !user.mess) {
    throw new AppError('No mess facility assigned to your user account.', 404, 'NO_MESS_ASSIGNED');
  }

  const mess = await MessFacility.findById(user.mess._id);
  if (!mess.counterQR) {
    const slug = encodeURIComponent((mess.name || 'Mess').replace(/\s+/g, '_'));
    mess.counterQR = `MESSMATE:COUNTER:${mess._id}:${slug}`;
    await mess.save();
  }

  const { session } = await getCurrentOrNextMealSession(mess._id);

  return {
    messId: mess._id,
    messName: mess.name,
    counterQR: mess.counterQR,
    activeSession: session
      ? {
          id: session._id,
          mealType: session.mealType,
          startTime: session.startTime,
          endTime: session.endTime,
          date: session.date
        }
      : null
  };
};

/**
 * Retrieve live counter payments list for staff/manager today
 */
export const getMessCounterPayments = async (userId) => {
  const user = await User.findById(userId).populate('mess');
  if (!user || !user.mess) {
    return [];
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const sessions = await MealSession.find({ mess: user.mess._id, date: { $gte: startOfDay } });
  const sessionIds = sessions.map((s) => s._id);

  const payments = await Coupon.find({
    mealSession: { $in: sessionIds },
    status: COUPON_STATUS.REDEEMED
  })
    .populate('student', 'firstName lastName rollNumber roomNumber hostel avatarUrl')
    .populate('mealSession', 'mealType date')
    .sort({ redeemedAt: -1, updatedAt: -1 })
    .limit(30);

  return payments;
};

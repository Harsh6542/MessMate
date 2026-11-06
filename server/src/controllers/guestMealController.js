import { GuestMealRequest } from '../models/GuestMealRequest.js';
import { MealSession } from '../models/MealSession.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { createNotification } from '../services/notificationService.js';
import { emitToUser, emitToRole, emitToRoom } from '../sockets/index.js';
import { ROLES, MEAL_TYPES } from '../config/constants.js';

// Default guest tariff per meal type in INR
const GUEST_PRICING = {
  [MEAL_TYPES.BREAKFAST]: 60,
  [MEAL_TYPES.LUNCH]: 90,
  [MEAL_TYPES.DINNER]: 90,
  [MEAL_TYPES.SNACKS]: 40
};

export const createGuestMealRequest = async (req, res, next) => {
  try {
    const student = req.user;
    if (!student.mess) {
      throw new AppError('You are not assigned to any mess facility.', 400, 'NO_MESS');
    }

    const { date, mealType, guestCount = 1, purpose, guestNames = [] } = req.body;

    if (!date || !mealType || !purpose) {
      throw new AppError('Date, meal type, and purpose are required.', 400, 'MISSING_FIELDS');
    }

    const parsedDate = new Date(date);
    parsedDate.setUTCHours(0, 0, 0, 0);

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (parsedDate < today) {
      throw new AppError('Cannot request guest meals for past dates.', 400, 'PAST_DATE');
    }

    const count = parseInt(guestCount, 10);
    if (isNaN(count) || count < 1 || count > 10) {
      throw new AppError('Guest count must be between 1 and 10.', 400, 'INVALID_COUNT');
    }

    const chargePerGuest = GUEST_PRICING[mealType] || 80;
    const totalAmountINR = count * chargePerGuest;

    const request = await GuestMealRequest.create({
      requestedBy: student._id,
      mess: student.mess,
      date: parsedDate,
      mealType,
      guestCount: count,
      purpose,
      guestNames,
      chargePerGuest,
      totalAmountINR,
      status: 'pending'
    });

    // Notify Mess Manager
    const managers = await User.find({
      mess: student.mess,
      role: ROLES.MESS_MANAGER,
      isActive: true
    });

    const alertPayload = {
      requestId: request._id,
      studentName: `${student.firstName} ${student.lastName}`,
      rollNumber: student.rollNumber,
      date: parsedDate,
      mealType,
      guestCount: count
    };

    emitToRoom(`mess:${student.mess}`, 'guest_meal:new_request', alertPayload);
    emitToRole(ROLES.MESS_MANAGER, 'guest_meal:new_request', alertPayload);

    for (const manager of managers) {
      await createNotification({
        recipient: manager._id,
        type: 'system_alert',
        title: 'New Guest Meal Request',
        message: `${student.firstName} ${student.lastName} (${student.rollNumber}) requested ${count} guest meal(s) for ${mealType.toUpperCase()} on ${parsedDate.toISOString().split('T')[0]}.`,
        actionUrl: '/manager/guest-meals',
        metadata: { requestId: request._id }
      });
    }

    res.status(201).json({
      status: 'success',
      message: 'Guest meal request submitted successfully.',
      data: { request }
    });
  } catch (error) {
    next(error);
  }
};

export const getMyGuestRequests = async (req, res, next) => {
  try {
    const requests = await GuestMealRequest.find({ requestedBy: req.user._id })
      .sort({ date: -1, createdAt: -1 });

    res.status(200).json({
      status: 'success',
      data: { requests }
    });
  } catch (error) {
    next(error);
  }
};

export const cancelGuestRequest = async (req, res, next) => {
  try {
    const request = await GuestMealRequest.findOne({
      _id: req.params.id,
      requestedBy: req.user._id
    });

    if (!request) {
      throw new AppError('Guest meal request not found.', 404, 'NOT_FOUND');
    }

    if (request.status !== 'pending') {
      throw new AppError(`Cannot cancel request with status '${request.status}'.`, 400, 'CANNOT_CANCEL');
    }

    request.status = 'cancelled';
    await request.save();

    res.status(200).json({
      status: 'success',
      message: 'Guest meal request cancelled.',
      data: { request }
    });
  } catch (error) {
    next(error);
  }
};

export const getAllGuestRequests = async (req, res, next) => {
  try {
    const messId = req.user.mess;
    if (!messId) {
      throw new AppError('No mess facility assigned to user.', 400, 'NO_MESS');
    }

    const { status, date, mealType, page = 1, limit = 20 } = req.query;
    const query = { mess: messId };

    if (status) query.status = status;
    if (mealType) query.mealType = mealType;
    if (date) {
      const targetDate = new Date(date);
      targetDate.setUTCHours(0, 0, 0, 0);
      query.date = targetDate;
    }

    const skip = (Math.max(1, page) - 1) * limit;

    const [requests, total] = await Promise.all([
      GuestMealRequest.find(query)
        .populate('requestedBy', 'firstName lastName rollNumber roomNumber email')
        .populate('approvedBy', 'firstName lastName')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      GuestMealRequest.countDocuments(query)
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        requests,
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const processGuestDecision = async (req, res, next) => {
  try {
    const messId = req.user.mess;
    const { id } = req.params;
    const { decision, rejectionReason } = req.body;

    if (!['approved', 'rejected'].includes(decision)) {
      throw new AppError('Decision must be either "approved" or "rejected".', 400, 'INVALID_DECISION');
    }

    const request = await GuestMealRequest.findOne({ _id: id, mess: messId });
    if (!request) {
      throw new AppError('Guest meal request not found in your mess.', 404, 'NOT_FOUND');
    }

    if (request.status !== 'pending') {
      throw new AppError(`Request has already been processed with status '${request.status}'.`, 400, 'ALREADY_PROCESSED');
    }

    request.status = decision;
    request.approvedBy = req.user._id;
    request.approvedAt = new Date();
    if (decision === 'rejected') {
      request.rejectionReason = rejectionReason || 'Rejected by mess administration';
    }

    await request.save();

    // If approved, update session guest count and declared demand
    if (decision === 'approved') {
      const session = await MealSession.findOne({
        mess: messId,
        date: request.date,
        mealType: request.mealType
      });

      if (session) {
        session.approvedGuestCount = (session.approvedGuestCount || 0) + request.guestCount;
        session.declaredDemand = Math.max(
          0,
          (session.totalEligibleResidents || 0) - (session.optOutCount || 0) + session.approvedGuestCount
        );
        await session.save();
      }
    }

    // Real-time notification to the student
    const dateStr = request.date.toISOString().split('T')[0];
    await createNotification({
      recipient: request.requestedBy,
      type: 'guest_meal_decision',
      title: `Guest Meal Request ${decision.toUpperCase()}`,
      message: `Your booking for ${request.guestCount} guest(s) for ${request.mealType.toUpperCase()} on ${dateStr} has been ${decision}.${decision === 'rejected' && rejectionReason ? ` Reason: ${rejectionReason}` : ''}`,
      actionUrl: '/student/guest-meals',
      metadata: { requestId: request._id, decision }
    });

    emitToUser(request.requestedBy, 'guest_meal:decision', {
      requestId: request._id,
      status: decision,
      mealType: request.mealType,
      date: request.date
    });

    res.status(200).json({
      status: 'success',
      message: `Guest meal request ${decision} successfully.`,
      data: { request }
    });
  } catch (error) {
    next(error);
  }
};


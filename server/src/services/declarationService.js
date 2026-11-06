import { MealDeclaration } from '../models/MealDeclaration.js';
import { MealSession } from '../models/MealSession.js';
import { AppError } from '../utils/AppError.js';
import {
  normalizeDate,
  getOrCreateMealSession
} from './mealSessionService.js';
import { DECLARATION_STATUS } from '../config/constants.js';

/**
 * Declare absence for a single meal
 */
export const declareSingleMeal = async ({ studentId, messId, date, mealType, reason }) => {
  const normalized = normalizeDate(date);
  const now = new Date();

  // Get or initialize the meal session to evaluate cutoff rules
  const session = await getOrCreateMealSession(messId, normalized, mealType);

  // Check if declaration cutoff deadline has passed
  if (now > session.cutoffTime) {
    const formattedCutoff = session.cutoffTime.toLocaleString();
    throw new AppError(
      `Declaration deadline for ${mealType} on ${normalized.toDateString()} passed at ${formattedCutoff}.`,
      400,
      'CUTOFF_EXCEEDED'
    );
  }

  // Check if student already has a declared status for this meal
  let declaration = await MealDeclaration.findOne({
    student: studentId,
    date: normalized,
    mealType
  });

  if (declaration) {
    if (declaration.status === DECLARATION_STATUS.DECLARED) {
      throw new AppError(
        `You have already declared absence for ${mealType} on this date.`,
        400,
        'ALREADY_DECLARED'
      );
    }
    // Re-activate previously cancelled declaration
    declaration.status = DECLARATION_STATUS.DECLARED;
    declaration.reason = reason || declaration.reason;
    declaration.declaredAt = new Date();
    declaration.cancelledAt = null;
    await declaration.save();
  } else {
    declaration = await MealDeclaration.create({
      student: studentId,
      mess: messId,
      mealSession: session._id,
      date: normalized,
      mealType,
      reason,
      status: DECLARATION_STATUS.DECLARED
    });
  }

  // Update session optOutCount and declaredDemand
  const optOutCount = await MealDeclaration.countDocuments({
    mess: messId,
    date: normalized,
    mealType,
    status: DECLARATION_STATUS.DECLARED
  });

  session.optOutCount = optOutCount;
  session.declaredDemand = Math.max(0, session.totalEligibleResidents - optOutCount + (session.approvedGuestCount || 0));
  await session.save();

  return declaration;
};

/**
 * Bulk absence declaration across date range (for travelling home or hostel leave)
 */
export const declareBulkAbsence = async ({
  studentId,
  messId,
  startDate,
  endDate,
  mealTypes = ['breakfast', 'lunch', 'dinner'],
  reason
}) => {
  const start = normalizeDate(startDate);
  const end = normalizeDate(endDate);

  if (start > end) {
    throw new AppError('Start date must be before or equal to end date.', 400, 'INVALID_DATE_RANGE');
  }

  const results = [];
  const errors = [];
  const current = new Date(start);

  while (current <= end) {
    for (const mealType of mealTypes) {
      try {
        const dec = await declareSingleMeal({
          studentId,
          messId,
          date: new Date(current),
          mealType,
          reason
        });
        results.push(dec);
      } catch (err) {
        errors.push({
          date: current.toISOString().split('T')[0],
          mealType,
          message: err.message
        });
      }
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return { results, errors, totalDeclared: results.length };
};

/**
 * Cancel a declaration and restore meal eligibility
 */
export const cancelDeclaration = async (declarationId, studentId) => {
  const declaration = await MealDeclaration.findOne({
    _id: declarationId,
    student: studentId
  });

  if (!declaration) {
    throw new AppError('Declaration record not found.', 404, 'NOT_FOUND');
  }

  if (declaration.status !== DECLARATION_STATUS.DECLARED) {
    throw new AppError('Declaration is not active or has already been cancelled.', 400, 'ALREADY_CANCELLED');
  }

  const session = await MealSession.findOne({
    mess: declaration.mess,
    date: declaration.date,
    mealType: declaration.mealType
  });

  const now = new Date();
  if (session && now > session.cutoffTime) {
    throw new AppError(
      'Cannot cancel declaration after the cutoff deadline has passed.',
      400,
      'CUTOFF_EXCEEDED'
    );
  }

  declaration.status = DECLARATION_STATUS.CANCELLED;
  declaration.cancelledAt = new Date();
  declaration.cancelledBy = studentId;
  await declaration.save();

  // Recalculate session metrics if session exists
  if (session) {
    const optOutCount = await MealDeclaration.countDocuments({
      mess: declaration.mess,
      date: declaration.date,
      mealType: declaration.mealType,
      status: DECLARATION_STATUS.DECLARED
    });
    session.optOutCount = optOutCount;
    session.declaredDemand = Math.max(0, session.totalEligibleResidents - optOutCount + (session.approvedGuestCount || 0));
    await session.save();
  }

  return declaration;
};

import { MealSession } from '../models/MealSession.js';
import { MessFacility } from '../models/MessFacility.js';
import { User } from '../models/User.js';
import { MealDeclaration } from '../models/MealDeclaration.js';
import { MEAL_TYPES, MEAL_SESSION_STATUS, DECLARATION_STATUS, ROLES } from '../config/constants.js';

// Helper to normalize date to midnight UTC
export const normalizeDate = (date = new Date()) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

// Helper to construct Date from normalized date and "HH:mm" time string
export const createDateTime = (normalizedDate, timeStr, dayOffset = 0) => {
  const [hours, minutes] = (timeStr || '00:00').split(':').map(Number);
  const result = new Date(normalizedDate);
  result.setUTCDate(result.getUTCDate() + dayOffset);
  result.setUTCHours(hours, minutes, 0, 0);
  return result;
};

/**
 * Get or automatically create daily MealSession for a mess, date, and mealType
 */
export const getOrCreateMealSession = async (messId, date = new Date(), mealType) => {
  const normalized = normalizeDate(date);

  let session = await MealSession.findOne({
    mess: messId,
    date: normalized,
    mealType
  });

  if (session) return session;

  const mess = await MessFacility.findById(messId);
  if (!mess) {
    throw new Error('Mess facility not found');
  }

  const timing = mess.mealTimings?.[mealType] || { start: '08:00', end: '10:00' };
  const cutoffStr = mess.declarationCutoffs?.[mealType] || '21:00';

  const startTime = createDateTime(normalized, timing.start);
  const endTime = createDateTime(normalized, timing.end);

  // For breakfast, cutoff is typically the evening before (dayOffset = -1)
  const dayOffset = mealType === MEAL_TYPES.BREAKFAST ? -1 : 0;
  const cutoffTime = createDateTime(normalized, cutoffStr, dayOffset);

  // Count active residents assigned to this mess/hostel
  const totalEligible = await User.countDocuments({
    role: ROLES.STUDENT,
    isActive: true,
    $or: [{ mess: messId }, { hostel: mess.hostel }]
  });

  // Count declared opt-outs for this meal session
  const optOutCount = await MealDeclaration.countDocuments({
    mess: messId,
    date: normalized,
    mealType,
    status: DECLARATION_STATUS.DECLARED
  });

  const declaredDemand = Math.max(0, totalEligible - optOutCount);

  session = await MealSession.create({
    mess: messId,
    date: normalized,
    mealType,
    startTime,
    endTime,
    cutoffTime,
    totalEligibleResidents: totalEligible,
    optOutCount,
    declaredDemand,
    managerAdjustedQuantity: declaredDemand,
    status: MEAL_SESSION_STATUS.UPCOMING
  });

  return session;
};

/**
 * Ensures all 3 daily sessions (breakfast, lunch, dinner) exist for a mess on a date
 */
export const ensureDailySessions = async (messId, date = new Date()) => {
  const types = [MEAL_TYPES.BREAKFAST, MEAL_TYPES.LUNCH, MEAL_TYPES.DINNER];
  const sessions = [];
  for (const type of types) {
    const s = await getOrCreateMealSession(messId, date, type);
    sessions.push(s);
  }
  return sessions;
};

/**
 * Determine the currently active meal session (or next upcoming if none active)
 */
export const getCurrentOrNextMealSession = async (messId) => {
  const now = new Date();
  const today = normalizeDate(now);

  // Make sure today's sessions are generated
  await ensureDailySessions(messId, today);

  // 1. Look for currently active session
  let activeSession = await MealSession.findOne({
    mess: messId,
    date: today,
    startTime: { $lte: now },
    endTime: { $gte: now }
  });

  if (activeSession) {
    if (activeSession.status !== MEAL_SESSION_STATUS.ACTIVE) {
      activeSession.status = MEAL_SESSION_STATUS.ACTIVE;
      await activeSession.save();
    }
    return { session: activeSession, isActive: true };
  }

  // 2. Next upcoming session today
  let nextSession = await MealSession.findOne({
    mess: messId,
    date: today,
    startTime: { $gt: now }
  }).sort({ startTime: 1 });

  if (nextSession) {
    return { session: nextSession, isActive: false };
  }

  // 3. If today's meals have passed, get tomorrow's breakfast
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const tomorrowBreakfast = await getOrCreateMealSession(messId, tomorrow, MEAL_TYPES.BREAKFAST);

  return { session: tomorrowBreakfast, isActive: false };
};

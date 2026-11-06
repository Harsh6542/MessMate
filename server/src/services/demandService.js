import { MealSession } from '../models/MealSession.js';
import { MealDeclaration } from '../models/MealDeclaration.js';
import { GuestMealRequest } from '../models/GuestMealRequest.js';
import { Attendance } from '../models/Attendance.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { ROLES, DECLARATION_STATUS } from '../config/constants.js';

/**
 * Predict meal demand for a session combining declared opt-outs, approved guests, and historical trends
 */
export const calculateDemandPrediction = async (sessionId) => {
  const session = await MealSession.findById(sessionId)
    .populate('mess', 'name hostel mealTimings')
    .exec();

  if (!session) {
    throw new AppError('Meal session not found.', 404, 'NOT_FOUND');
  }

  // 1. Total active resident count
  const totalEligible = await User.countDocuments({
    role: ROLES.STUDENT,
    isActive: true,
    $or: [{ mess: session.mess._id }, { hostel: session.mess.hostel }]
  });

  // 2. Active declared opt-outs
  const optOutCount = await MealDeclaration.countDocuments({
    mess: session.mess._id,
    date: session.date,
    mealType: session.mealType,
    status: DECLARATION_STATUS.DECLARED
  });

  // 3. Approved guest meals
  const guestRequests = await GuestMealRequest.find({
    mess: session.mess._id,
    date: session.date,
    mealType: session.mealType,
    status: 'approved'
  });

  const approvedGuestCount = guestRequests.reduce((acc, curr) => acc + (curr.guestCount || 0), 0);

  // 4. Declared Demand
  const declaredDemand = Math.max(0, totalEligible - optOutCount + approvedGuestCount);

  // 5. Historical Attendance Patterns (Past 30 days)
  const thirtyDaysAgo = new Date(session.date);
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);

  const pastSessions = await MealSession.find({
    mess: session.mess._id,
    mealType: session.mealType,
    date: { $gte: thirtyDaysAgo, $lt: session.date },
    actualServedCount: { $gt: 0 }
  });

  let historicalTurnoutRate = 0.94; // Default 94% turnout
  if (pastSessions.length >= 3) {
    const totalRatio = pastSessions.reduce((acc, s) => {
      const demand = s.declaredDemand || s.totalEligibleResidents || 1;
      return acc + s.actualServedCount / demand;
    }, 0);
    historicalTurnoutRate = Number((totalRatio / pastSessions.length).toFixed(2));
  }

  // 6. Recommended preparation quantity (with 3% safety buffer for walk-ins)
  const safetyBuffer = Math.max(5, Math.round(declaredDemand * 0.03));
  const recommendedQuantity = Math.round(declaredDemand * historicalTurnoutRate) + safetyBuffer;

  // Sync to session document
  session.totalEligibleResidents = totalEligible;
  session.optOutCount = optOutCount;
  session.approvedGuestCount = approvedGuestCount;
  session.declaredDemand = declaredDemand;
  if (!session.managerAdjustedQuantity) {
    session.managerAdjustedQuantity = recommendedQuantity;
  }
  await session.save();

  return {
    session,
    breakdown: {
      totalEligibleResidents: totalEligible,
      declaredOptOuts: optOutCount,
      approvedGuests: approvedGuestCount,
      declaredDemand,
      historicalTurnoutRate: `${Math.round(historicalTurnoutRate * 100)}%`,
      safetyBufferServings: safetyBuffer,
      recommendedPreparationQuantity: recommendedQuantity,
      managerAdjustedQuantity: session.managerAdjustedQuantity
    }
  };
};

/**
 * Manager overrides final approved cooking quantity
 */
export const adjustPreparationQuantity = async (sessionId, quantity, managerId) => {
  const session = await MealSession.findById(sessionId);
  if (!session) {
    throw new AppError('Meal session not found.', 404, 'NOT_FOUND');
  }

  const adjusted = parseInt(quantity, 10);
  if (isNaN(adjusted) || adjusted < 0) {
    throw new AppError('Quantity must be a valid non-negative number.', 400, 'INVALID_QUANTITY');
  }

  session.managerAdjustedQuantity = adjusted;
  await session.save();

  return session;
};


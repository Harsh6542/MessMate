import { calculateDemandPrediction, adjustPreparationQuantity } from '../services/demandService.js';
import { MealSession } from '../models/MealSession.js';
import { Menu } from '../models/Menu.js';
import { ensureDailySessions } from '../services/mealSessionService.js';
import { AppError } from '../utils/AppError.js';

export const getPrediction = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const result = await calculateDemandPrediction(sessionId);

    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const updateQuantity = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { quantity } = req.body;

    const session = await adjustPreparationQuantity(sessionId, quantity, req.user._id);

    res.status(200).json({
      status: 'success',
      message: 'Preparation quantity updated successfully.',
      data: { session }
    });
  } catch (error) {
    next(error);
  }
};

export const getKitchenPrepSheet = async (req, res, next) => {
  try {
    const messId = req.user.mess;
    if (!messId) {
      throw new AppError('No mess facility assigned to user.', 400, 'NO_MESS');
    }

    const { date, sessionId } = req.query;
    let targetDate = date ? new Date(date) : new Date();
    targetDate.setUTCHours(0, 0, 0, 0);

    let sessions = [];
    if (sessionId) {
      const s = await MealSession.findOne({ _id: sessionId, mess: messId });
      if (s) sessions = [s];
    } else {
      // Ensure daily sessions exist for targetDate
      sessions = await ensureDailySessions(messId, targetDate);
    }

    const dayOfWeek = targetDate.getUTCDay();

    // Enrich each session with prediction + menu dishes
    const prepSheets = await Promise.all(
      sessions.map(async (sess) => {
        const prediction = await calculateDemandPrediction(sess._id);

        const menu = await Menu.findOne({
          mess: messId,
          dayOfWeek,
          mealType: sess.mealType,
          isActive: true
        });

        const targetCount =
          sess.managerAdjustedQuantity > 0
            ? sess.managerAdjustedQuantity
            : prediction.breakdown.recommendedPreparationQuantity;

        const dishesWithPortions = (menu?.dishes || []).map((dish) => {
          let estimatedRawKg = 0;
          let portionNote = '';

          // Heuristic raw quantity multipliers per head for kitchen staff
          const nameLower = dish.name.toLowerCase();
          if (nameLower.includes('rice') || nameLower.includes('biryani') || nameLower.includes('pulao')) {
            estimatedRawKg = Math.round(targetCount * 0.12 * 10) / 10; // ~120g raw rice per person
            portionNote = '120g raw grain/student';
          } else if (nameLower.includes('roti') || nameLower.includes('chapati') || nameLower.includes('paratha')) {
            const rotiCount = targetCount * 3; // ~3 rotis per student
            estimatedRawKg = Math.round(rotiCount * 0.035 * 10) / 10; // ~35g atta per roti
            portionNote = `~${rotiCount} pieces total (3 pcs/student)`;
          } else if (nameLower.includes('dal') || nameLower.includes('sambar') || nameLower.includes('chana')) {
            estimatedRawKg = Math.round(targetCount * 0.05 * 10) / 10; // ~50g raw pulses/student
            portionNote = '50g raw pulse/student';
          } else if (nameLower.includes('paneer') || nameLower.includes('chicken') || nameLower.includes('egg')) {
            estimatedRawKg = Math.round(targetCount * 0.15 * 10) / 10;
            portionNote = '150g per student';
          } else {
            estimatedRawKg = Math.round(targetCount * 0.1 * 10) / 10;
            portionNote = 'Standard serving batch';
          }

          return {
            ...dish.toObject(),
            estimatedRawKg,
            portionNote
          };
        });

        return {
          sessionId: sess._id,
          mealType: sess.mealType,
          startTime: sess.startTime,
          endTime: sess.endTime,
          cutoffTime: sess.cutoffTime,
          status: sess.status,
          declaredDemand: prediction.breakdown.declaredDemand,
          recommendedQuantity: prediction.breakdown.recommendedPreparationQuantity,
          managerAdjustedQuantity: sess.managerAdjustedQuantity,
          targetCookingServings: targetCount,
          actualServedCount: sess.actualServedCount,
          safetyBuffer: prediction.breakdown.safetyBufferServings,
          turnoutRate: prediction.breakdown.historicalTurnoutRate,
          menu: menu
            ? {
                title: menu.title,
                dishes: dishesWithPortions
              }
            : null
        };
      })
    );

    res.status(200).json({
      status: 'success',
      data: {
        date: targetDate,
        dayOfWeek,
        prepSheets
      }
    });
  } catch (error) {
    next(error);
  }
};

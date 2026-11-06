import { WasteLog } from '../models/WasteLog.js';
import { MealSession } from '../models/MealSession.js';
import { AppError } from '../utils/AppError.js';
import { emitToRoom, emitToRole } from '../sockets/index.js';
import { ROLES } from '../config/constants.js';

export const recordWasteLog = async (req, res, next) => {
  try {
    const messId = req.user.mess;
    if (!messId) {
      throw new AppError('No mess facility assigned to user.', 400, 'NO_MESS');
    }

    const {
      mealSessionId,
      totalPreparedServings,
      totalActualServed,
      unservedSurplusWeightKg,
      plateWasteWeightKg,
      estimatedCostLostINR,
      disposalMethod = 'municipal_waste',
      remarks = ''
    } = req.body;

    if (!mealSessionId) {
      throw new AppError('Meal session ID is required.', 400, 'MISSING_SESSION');
    }

    const session = await MealSession.findOne({ _id: mealSessionId, mess: messId });
    if (!session) {
      throw new AppError('Meal session not found in your mess.', 404, 'SESSION_NOT_FOUND');
    }

    const surplusKg = Number(unservedSurplusWeightKg) || 0;
    const plateKg = Number(plateWasteWeightKg) || 0;

    if (surplusKg < 0 || plateKg < 0) {
      throw new AppError('Waste weights cannot be negative.', 400, 'INVALID_WEIGHT');
    }

    // Default cost calculation if not provided (~Rs 50/kg prepared surplus, ~Rs 35/kg plate waste)
    const costLost =
      estimatedCostLostINR !== undefined && estimatedCostLostINR !== null
        ? Number(estimatedCostLostINR)
        : Math.round(surplusKg * 50 + plateKg * 35);

    // Upsert waste log for this session
    const wasteLog = await WasteLog.findOneAndUpdate(
      { mealSession: mealSessionId },
      {
        mealSession: mealSessionId,
        mess: messId,
        totalPreparedServings: Number(totalPreparedServings) || session.managerAdjustedQuantity || session.declaredDemand,
        totalActualServed: Number(totalActualServed) || session.actualServedCount,
        unservedSurplusWeightKg: surplusKg,
        plateWasteWeightKg: plateKg,
        estimatedCostLostINR: costLost,
        disposalMethod,
        remarks,
        recordedBy: req.user._id
      },
      { new: true, upsert: true, runValidators: true }
    ).populate('mealSession', 'date mealType declaredDemand actualServedCount');

    // Notify manager in real-time
    const payload = {
      wasteLogId: wasteLog._id,
      date: session.date,
      mealType: session.mealType,
      surplusKg,
      plateKg,
      costLost
    };

    emitToRoom(`mess:${messId}`, 'waste:recorded', payload);
    emitToRole(ROLES.MESS_MANAGER, 'waste:recorded', payload);

    res.status(201).json({
      status: 'success',
      message: 'Food waste record saved successfully.',
      data: { wasteLog }
    });
  } catch (error) {
    next(error);
  }
};

export const getWasteLogs = async (req, res, next) => {
  try {
    const messId = req.user.mess;
    if (!messId) {
      throw new AppError('No mess facility assigned to user.', 400, 'NO_MESS');
    }

    const { startDate, endDate, mealType, page = 1, limit = 20 } = req.query;
    const query = { mess: messId };

    if (startDate || endDate) {
      const dateFilter = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) dateFilter.$lte = new Date(endDate);

      // Find matching sessions first
      const matchingSessions = await MealSession.find({
        mess: messId,
        date: dateFilter,
        ...(mealType ? { mealType } : {})
      }).select('_id');

      query.mealSession = { $in: matchingSessions.map((s) => s._id) };
    }

    const skip = (Math.max(1, page) - 1) * limit;

    const [logs, total] = await Promise.all([
      WasteLog.find(query)
        .populate('mealSession', 'date mealType declaredDemand actualServedCount managerAdjustedQuantity')
        .populate('recordedBy', 'firstName lastName role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      WasteLog.countDocuments(query)
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        logs,
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getWasteSummary = async (req, res, next) => {
  try {
    const messId = req.user.mess;
    if (!messId) {
      throw new AppError('No mess facility assigned to user.', 400, 'NO_MESS');
    }

    const days = parseInt(req.query.days || '30', 10);
    const cutoffDate = new Date();
    cutoffDate.setUTCDate(cutoffDate.getUTCDate() - days);

    const logs = await WasteLog.find({
      mess: messId,
      createdAt: { $gte: cutoffDate }
    })
      .populate('mealSession', 'date mealType declaredDemand actualServedCount')
      .sort({ createdAt: 1 });

    const totalSurplusKg = logs.reduce((acc, l) => acc + (l.unservedSurplusWeightKg || 0), 0);
    const totalPlateWasteKg = logs.reduce((acc, l) => acc + (l.plateWasteWeightKg || 0), 0);
    const totalCostLost = logs.reduce((acc, l) => acc + (l.estimatedCostLostINR || 0), 0);
    const totalServingsWasted = logs.reduce(
      (acc, l) => acc + Math.max(0, (l.totalPreparedServings || 0) - (l.totalActualServed || 0)),
      0
    );

    // Grouping by meal type
    const byMealType = {
      breakfast: { surplusKg: 0, plateWasteKg: 0, costLost: 0, count: 0 },
      lunch: { surplusKg: 0, plateWasteKg: 0, costLost: 0, count: 0 },
      dinner: { surplusKg: 0, plateWasteKg: 0, costLost: 0, count: 0 },
      snacks: { surplusKg: 0, plateWasteKg: 0, costLost: 0, count: 0 }
    };

    logs.forEach((log) => {
      const type = log.mealSession?.mealType || 'other';
      if (byMealType[type]) {
        byMealType[type].surplusKg += log.unservedSurplusWeightKg || 0;
        byMealType[type].plateWasteKg += log.plateWasteWeightKg || 0;
        byMealType[type].costLost += log.estimatedCostLostINR || 0;
        byMealType[type].count += 1;
      }
    });

    res.status(200).json({
      status: 'success',
      data: {
        periodDays: days,
        totalLogs: logs.length,
        totalSurplusKg: Math.round(totalSurplusKg * 10) / 10,
        totalPlateWasteKg: Math.round(totalPlateWasteKg * 10) / 10,
        totalWasteKg: Math.round((totalSurplusKg + totalPlateWasteKg) * 10) / 10,
        totalCostLostINR: Math.round(totalCostLost),
        totalServingsWasted,
        byMealType,
        recentLogs: logs.slice(-10).reverse()
      }
    });
  } catch (error) {
    next(error);
  }
};

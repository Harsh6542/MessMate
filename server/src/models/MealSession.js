import mongoose from 'mongoose';
import { MEAL_TYPES, MEAL_SESSION_STATUS } from '../config/constants.js';

const mealSessionSchema = new mongoose.Schema(
  {
    mess: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MessFacility',
      required: [true, 'Mess facility reference is required'],
      index: true
    },
    date: {
      type: Date,
      required: [true, 'Session date is required'],
      index: true
    }, // Stored normalized to YYYY-MM-DD (00:00:00 UTC)
    mealType: {
      type: String,
      required: [true, 'Meal type is required'],
      enum: Object.values(MEAL_TYPES),
      index: true
    },
    status: {
      type: String,
      enum: Object.values(MEAL_SESSION_STATUS),
      default: MEAL_SESSION_STATUS.UPCOMING,
      index: true
    },
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      required: true
    },
    cutoffTime: {
      type: Date,
      required: true
    },
    totalEligibleResidents: {
      type: Number,
      default: 0
    },
    optOutCount: {
      type: Number,
      default: 0
    },
    approvedGuestCount: {
      type: Number,
      default: 0
    },
    declaredDemand: {
      type: Number,
      default: 0
    },
    managerAdjustedQuantity: {
      type: Number,
      default: 0
    },
    actualServedCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index: exactly one session per mess, date, and mealType
mealSessionSchema.index({ mess: 1, date: 1, mealType: 1 }, { unique: true });

export const MealSession = mongoose.model('MealSession', mealSessionSchema);
export default MealSession;

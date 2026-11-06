import mongoose from 'mongoose';
import { MEAL_TYPES, DECLARATION_STATUS } from '../config/constants.js';

const mealDeclarationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required'],
      index: true
    },
    mess: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MessFacility',
      required: [true, 'Mess facility reference is required'],
      index: true
    },
    mealSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MealSession',
      default: null,
      index: true
    },
    date: {
      type: Date,
      required: [true, 'Absence date is required'],
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
      enum: Object.values(DECLARATION_STATUS),
      default: DECLARATION_STATUS.DECLARED,
      index: true
    },
    reason: {
      type: String,
      trim: true,
      default: null
    },
    declaredAt: {
      type: Date,
      default: Date.now
    },
    cancelledAt: {
      type: Date,
      default: null
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    isLateCancel: {
      type: Boolean,
      default: false
    },
    auditNote: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index: A student can only have ONE declaration record per date and mealType
mealDeclarationSchema.index({ student: 1, date: 1, mealType: 1 }, { unique: true });

export const MealDeclaration = mongoose.model('MealDeclaration', mealDeclarationSchema);
export default MealDeclaration;


import mongoose from 'mongoose';
import { COUPON_STATUS } from '../config/constants.js';

const couponSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required'],
      index: true
    },
    mealSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MealSession',
      required: [true, 'Meal session reference is required'],
      index: true
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    qrPayload: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      default: 500
    },
    transactionId: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    paymentMethod: {
      type: String,
      enum: ['student_scan_counter', 'staff_scan_student', 'manual_verify'],
      default: 'student_scan_counter'
    },
    semester: {
      type: String,
      default: '2026-SPRING'
    },
    status: {
      type: String,
      enum: Object.values(COUPON_STATUS),
      default: COUPON_STATUS.ACTIVE,
      index: true
    },
    generatedAt: {
      type: Date,
      default: Date.now
    },
    redeemedAt: {
      type: Date,
      default: null
    },
    redeemedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index: Exactly 1 coupon record per student per meal session
couponSchema.index({ student: 1, mealSession: 1 }, { unique: true });

export const Coupon = mongoose.model('Coupon', couponSchema);
export default Coupon;


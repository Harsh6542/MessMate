import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
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
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon',
      default: null
    },
    verificationMethod: {
      type: String,
      enum: ['qr_scan', 'manual_roll_lookup', 'card_swipe', 'admin_override'],
      default: 'qr_scan'
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    manualReason: {
      type: String,
      default: null
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index: exactly 1 attendance record per student per meal session
attendanceSchema.index({ student: 1, mealSession: 1 }, { unique: true });

export const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;


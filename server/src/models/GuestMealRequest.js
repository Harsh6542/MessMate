import mongoose from 'mongoose';
import { MEAL_TYPES } from '../config/constants.js';

const guestMealRequestSchema = new mongoose.Schema(
  {
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student applicant reference is required'],
      index: true
    },
    mess: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MessFacility',
      required: [true, 'Mess facility reference is required'],
      index: true
    },
    date: {
      type: Date,
      required: [true, 'Meal date is required'],
      index: true
    },
    mealType: {
      type: String,
      required: [true, 'Meal type is required'],
      enum: Object.values(MEAL_TYPES)
    },
    guestCount: {
      type: Number,
      required: [true, 'Guest count is required'],
      min: [1, 'Must book for at least 1 guest'],
      max: [10, 'Maximum 10 guests per booking']
    },
    purpose: {
      type: String,
      required: [true, 'Purpose is required (e.g. Visiting parents)'],
      trim: true
    },
    guestNames: [
      {
        type: String,
        trim: true
      }
    ],
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
      index: true
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    approvedAt: {
      type: Date,
      default: null
    },
    chargePerGuest: {
      type: Number,
      default: 60 // Default INR 60 per guest meal
    },
    totalCharge: {
      type: Number,
      default: 0
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'billed_to_room'],
      default: 'billed_to_room'
    },
    remarks: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

guestMealRequestSchema.index({ requestedBy: 1, date: -1 });
guestMealRequestSchema.index({ mess: 1, date: 1, status: 1 });

export const GuestMealRequest = mongoose.model('GuestMealRequest', guestMealRequestSchema);
export default GuestMealRequest;


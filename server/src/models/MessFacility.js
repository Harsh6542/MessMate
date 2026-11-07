import mongoose from 'mongoose';
import { BILLING_POLICIES } from '../config/constants.js';

const messFacilitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Mess facility name is required'],
      trim: true
    },
    hostel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hostel',
      required: [true, 'Associated hostel is required'],
      index: true
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    mealTimings: {
      breakfast: {
        start: { type: String, default: '07:30' },
        end: { type: String, default: '09:30' }
      },
      lunch: {
        start: { type: String, default: '12:30' },
        end: { type: String, default: '14:30' }
      },
      dinner: {
        start: { type: String, default: '19:30' },
        end: { type: String, default: '21:30' }
      }
    },
    declarationCutoffs: {
      breakfast: { type: String, default: '21:00' }, // Cutoff time before meal day
      lunch: { type: String, default: '09:00' },     // Cutoff time on meal day
      dinner: { type: String, default: '15:00' }     // Cutoff time on meal day
    },
    billingPolicy: {
      type: String,
      enum: Object.values(BILLING_POLICIES),
      default: BILLING_POLICIES.FIXED_MONTHLY
    },
    counterQR: {
      type: String,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

messFacilitySchema.pre('save', function (next) {
  if (!this.counterQR) {
    const slug = encodeURIComponent((this.name || 'Mess').replace(/\s+/g, '_'));
    this.counterQR = `MESSMATE:COUNTER:${this._id}:${slug}`;
  }
  next();
});

export const MessFacility = mongoose.model('MessFacility', messFacilitySchema);
export default MessFacility;


import mongoose from 'mongoose';

const wasteLogSchema = new mongoose.Schema(
  {
    mealSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MealSession',
      required: [true, 'Associated meal session is required'],
      unique: true,
      index: true
    },
    mess: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MessFacility',
      required: [true, 'Associated mess facility is required'],
      index: true
    },
    totalPreparedServings: {
      type: Number,
      required: [true, 'Total prepared servings count is required'],
      min: [0, 'Cannot be negative']
    },
    totalActualServed: {
      type: Number,
      required: [true, 'Total actual served count is required'],
      min: [0, 'Cannot be negative']
    },
    unservedSurplusWeightKg: {
      type: Number,
      required: [true, 'Unserved surplus weight in kilograms is required'],
      min: [0, 'Weight cannot be negative']
    },
    plateWasteWeightKg: {
      type: Number,
      required: [true, 'Plate waste weight in kilograms is required'],
      min: [0, 'Weight cannot be negative']
    },
    estimatedCostLostINR: {
      type: Number,
      default: 0
    },
    disposalMethod: {
      type: String,
      enum: ['compost', 'biogas', 'pig_farm_donation', 'municipal_waste', 'other'],
      default: 'municipal_waste'
    },
    remarks: {
      type: String,
      trim: true,
      default: ''
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Staff member identifier is required']
    }
  },
  {
    timestamps: true
  }
);

wasteLogSchema.index({ mess: 1, createdAt: -1 });

export const WasteLog = mongoose.model('WasteLog', wasteLogSchema);
export default WasteLog;


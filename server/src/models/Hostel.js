import mongoose from 'mongoose';

const hostelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Hostel name is required'],
      unique: true,
      trim: true
    },
    code: {
      type: String,
      required: [true, 'Hostel code is required (e.g. H-KOSI)'],
      unique: true,
      trim: true,
      uppercase: true
    },
    address: {
      type: String,
      trim: true,
      default: ''
    },
    capacity: {
      type: Number,
      required: [true, 'Hostel capacity is required'],
      min: [1, 'Capacity must be at least 1 resident']
    },
    type: {
      type: String,
      enum: ['boys', 'girls', 'coed'],
      default: 'boys',
      index: true
    },
    warden: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
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

export const Hostel = mongoose.model('Hostel', hostelSchema);
export default Hostel;


import mongoose from 'mongoose';
import { COMPLAINT_CATEGORIES, COMPLAINT_STATUS, COMPLAINT_PRIORITIES } from '../config/constants.js';

const complaintResponseSchema = new mongoose.Schema(
  {
    by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    isInternal: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const complaintSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    complainant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Complainant user reference is required'],
      index: true
    },
    mess: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MessFacility',
      required: [true, 'Associated mess facility is required'],
      index: true
    },
    category: {
      type: String,
      required: [true, 'Complaint category is required'],
      enum: Object.values(COMPLAINT_CATEGORIES),
      index: true
    },
    priority: {
      type: String,
      enum: Object.values(COMPLAINT_PRIORITIES),
      default: COMPLAINT_PRIORITIES.MEDIUM,
      index: true
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: [120, 'Subject cannot exceed 120 characters']
    },
    description: {
      type: String,
      required: [true, 'Detailed description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    images: [
      {
        type: String,
        trim: true
      }
    ],
    status: {
      type: String,
      enum: Object.values(COMPLAINT_STATUS),
      default: COMPLAINT_STATUS.SUBMITTED,
      index: true
    },
    isConfidential: {
      type: Boolean,
      default: false
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    resolutionDeadline: {
      type: Date,
      default: null
    },
    resolvedAt: {
      type: Date,
      default: null
    },
    responses: [complaintResponseSchema],
    escalatedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    escalatedAt: {
      type: Date,
      default: null
    },
    escalationReason: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

complaintSchema.index({ mess: 1, status: 1, priority: 1 });
complaintSchema.index({ complainant: 1, createdAt: -1 });

export const Complaint = mongoose.model('Complaint', complaintSchema);
export default Complaint;


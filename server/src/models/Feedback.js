import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
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
    attendance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attendance',
      required: [true, 'Attendance verification reference is required']
    },
    ratings: {
      taste: {
        type: Number,
        required: [true, 'Taste rating (1-5) is required'],
        min: 1,
        max: 5
      },
      hygiene: {
        type: Number,
        required: [true, 'Hygiene rating (1-5) is required'],
        min: 1,
        max: 5
      },
      temperature: {
        type: Number,
        required: [true, 'Food temperature rating (1-5) is required'],
        min: 1,
        max: 5
      },
      portionSize: {
        type: Number,
        required: [true, 'Portion size rating (1-5) is required'],
        min: 1,
        max: 5
      },
      overall: {
        type: Number,
        required: [true, 'Overall experience rating (1-5) is required'],
        min: 1,
        max: 5
      }
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [500, 'Comment cannot exceed 500 characters'],
      default: ''
    },
    isFlagged: {
      type: Boolean,
      default: false
    },
    managerResponse: {
      text: { type: String, trim: true },
      respondedAt: { type: Date },
      respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index: A student can only review a meal session once
feedbackSchema.index({ student: 1, mealSession: 1 }, { unique: true });

export const Feedback = mongoose.model('Feedback', feedbackSchema);
export default Feedback;


import mongoose from 'mongoose';
import { MEAL_TYPES } from '../config/constants.js';

const dishSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Dish name is required'],
      trim: true
    },
    category: {
      type: String,
      enum: ['staple', 'main_curry', 'side_dish', 'beverage', 'dessert', 'salad_snack'],
      default: 'main_curry'
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    isVeg: {
      type: Boolean,
      default: true
    },
    allergens: [
      {
        type: String,
        trim: true
      }
    ]
  },
  { _id: true }
);

const menuSchema = new mongoose.Schema(
  {
    mess: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MessFacility',
      required: [true, 'Associated mess facility is required'],
      index: true
    },
    dayOfWeek: {
      type: Number,
      required: [true, 'Day of week (0-6) is required'],
      min: 0,
      max: 6
    }, // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    mealType: {
      type: String,
      required: [true, 'Meal type is required'],
      enum: Object.values(MEAL_TYPES)
    },
    dishes: [dishSchema],
    isSpecial: {
      type: Boolean,
      default: false
    },
    specialDate: {
      type: Date,
      default: null
    },
    specialMealName: {
      type: String,
      default: null
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    publishedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Compound index: Only 1 regular menu per day-of-week per mealType for a mess facility
menuSchema.index({ mess: 1, dayOfWeek: 1, mealType: 1, isSpecial: 1 }, { unique: true });

export const Menu = mongoose.model('Menu', menuSchema);
export default Menu;


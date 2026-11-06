import mongoose from 'mongoose';

const inventoryItemSchema = new mongoose.Schema(
  {
    mess: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MessFacility',
      required: [true, 'Associated mess facility is required'],
      index: true
    },
    name: {
      type: String,
      required: [true, 'Inventory item name is required'],
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Item category is required'],
      enum: ['grain', 'vegetable', 'oil', 'dairy', 'spice', 'pulse', 'meat_egg', 'other']
    },
    unit: {
      type: String,
      required: [true, 'Measurement unit is required'],
      enum: ['kg', 'litre', 'pieces', 'packets', 'gram']
    },
    currentStock: {
      type: Number,
      required: [true, 'Current stock level is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0
    },
    minimumThreshold: {
      type: Number,
      required: [true, 'Minimum low-stock threshold is required'],
      min: [0, 'Threshold cannot be negative'],
      default: 10
    },
    unitCostEstimate: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    lastRestockedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index per mess facility
inventoryItemSchema.index({ mess: 1, name: 1 }, { unique: true });
inventoryItemSchema.index({ mess: 1, currentStock: 1, minimumThreshold: 1 });

export const InventoryItem = mongoose.model('InventoryItem', inventoryItemSchema);
export default InventoryItem;

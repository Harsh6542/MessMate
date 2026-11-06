import mongoose from 'mongoose';

const stockTransactionSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InventoryItem',
      required: [true, 'Inventory item reference is required'],
      index: true
    },
    mess: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MessFacility',
      required: [true, 'Associated mess facility is required'],
      index: true
    },
    type: {
      type: String,
      required: [true, 'Transaction type is required'],
      enum: ['purchase', 'consumption', 'adjustment', 'spoilage_wastage'],
      index: true
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0.01, 'Quantity must be positive']
    },
    previousStock: {
      type: Number,
      required: true
    },
    newStock: {
      type: Number,
      required: true
    },
    unitPrice: {
      type: Number,
      default: 0
    },
    vendor: {
      type: String,
      trim: true,
      default: null
    },
    invoiceNumber: {
      type: String,
      trim: true,
      default: null
    },
    remarks: {
      type: String,
      trim: true,
      default: ''
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
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

// Fallback synchronization between performedBy and recordedBy
stockTransactionSchema.pre('validate', function (next) {
  if (!this.recordedBy && this.performedBy) {
    this.recordedBy = this.performedBy;
  }
  if (!this.performedBy && this.recordedBy) {
    this.performedBy = this.recordedBy;
  }
  if (!this.recordedBy && !this.performedBy) {
    return next(new Error('Transaction requires a recordedBy or performedBy user reference.'));
  }
  next();
});

stockTransactionSchema.index({ item: 1, timestamp: -1 });
stockTransactionSchema.index({ mess: 1, type: 1, timestamp: -1 });

export const StockTransaction = mongoose.model('StockTransaction', stockTransactionSchema);
export default StockTransaction;


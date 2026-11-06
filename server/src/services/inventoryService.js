import { InventoryItem } from '../models/InventoryItem.js';
import { StockTransaction } from '../models/StockTransaction.js';
import { User } from '../models/User.js';
import { createNotification } from './notificationService.js';
import { emitToRoom, emitToRole } from '../sockets/index.js';
import { AppError } from '../utils/AppError.js';
import { ROLES } from '../config/constants.js';

export const createItem = async (messId, itemData) => {
  const existing = await InventoryItem.findOne({
    mess: messId,
    name: { $regex: new RegExp(`^${itemData.name.trim()}$`, 'i') },
    isActive: true
  });

  if (existing) {
    throw new AppError(`Inventory item '${itemData.name}' already exists in this mess.`, 409, 'ITEM_EXISTS');
  }

  const item = await InventoryItem.create({
    ...itemData,
    mess: messId
  });

  return item;
};

export const getItems = async (messId, { category, lowStockOnly, search } = {}) => {
  const query = { mess: messId, isActive: true };

  if (category) {
    query.category = category;
  }

  if (search) {
    query.name = { $regex: search.trim(), $options: 'i' };
  }

  if (lowStockOnly === 'true' || lowStockOnly === true) {
    query.$expr = { $lte: ['$currentStock', '$minimumThreshold'] };
  }

  return InventoryItem.find(query).sort({ name: 1 });
};

export const getItemById = async (itemId, messId) => {
  const item = await InventoryItem.findOne({ _id: itemId, mess: messId });
  if (!item) {
    throw new AppError('Inventory item not found.', 404, 'NOT_FOUND');
  }
  return item;
};

export const updateItem = async (itemId, messId, updates) => {
  const item = await InventoryItem.findOne({ _id: itemId, mess: messId });
  if (!item) {
    throw new AppError('Inventory item not found.', 404, 'NOT_FOUND');
  }

  const allowedUpdates = ['name', 'category', 'unit', 'minimumThreshold', 'unitCostEstimate', 'isActive'];
  allowedUpdates.forEach((key) => {
    if (updates[key] !== undefined) {
      item[key] = updates[key];
    }
  });

  await item.save();
  return item;
};

export const recordTransaction = async (
  messId,
  performedByUserId,
  { itemId, type, quantity, unitPrice = 0, vendor = null, invoiceNumber = null, remarks = '' }
) => {
  const numQty = Number(quantity);
  if (isNaN(numQty) || numQty <= 0) {
    throw new AppError('Quantity must be a positive number.', 400, 'INVALID_QUANTITY');
  }

  const item = await InventoryItem.findOne({ _id: itemId, mess: messId });
  if (!item) {
    throw new AppError('Inventory item not found in this mess.', 404, 'ITEM_NOT_FOUND');
  }

  const previousStock = item.currentStock;
  let newStock;

  switch (type) {
    case 'purchase':
      newStock = previousStock + numQty;
      item.lastRestockedAt = new Date();
      if (unitPrice > 0) {
        item.unitCostEstimate = unitPrice;
      }
      break;

    case 'consumption':
      if (previousStock < numQty) {
        throw new AppError(
          `Insufficient stock available for consumption. Current stock: ${previousStock} ${item.unit}. Requested: ${numQty} ${item.unit}.`,
          400,
          'INSUFFICIENT_STOCK'
        );
      }
      newStock = previousStock - numQty;
      break;

    case 'spoilage_wastage':
      if (previousStock < numQty) {
        throw new AppError(
          `Spoilage quantity cannot exceed current stock level of ${previousStock} ${item.unit}.`,
          400,
          'INSUFFICIENT_STOCK'
        );
      }
      newStock = previousStock - numQty;
      break;

    case 'adjustment':
      // Direct physical stock count adjustment
      newStock = numQty;
      break;

    default:
      throw new AppError('Invalid transaction type.', 400, 'INVALID_TYPE');
  }

  item.currentStock = Math.round(newStock * 100) / 100;
  await item.save();

  const transaction = await StockTransaction.create({
    item: item._id,
    mess: messId,
    type,
    quantity: numQty,
    previousStock,
    newStock: item.currentStock,
    unitPrice,
    vendor,
    invoiceNumber,
    remarks,
    performedBy: performedByUserId
  });

  // Check low stock condition
  if (item.currentStock <= item.minimumThreshold) {
    const managers = await User.find({
      mess: messId,
      role: ROLES.MESS_MANAGER,
      isActive: true
    });

    const alertPayload = {
      itemId: item._id,
      name: item.name,
      currentStock: item.currentStock,
      threshold: item.minimumThreshold,
      unit: item.unit
    };

    emitToRoom(`mess:${messId}`, 'inventory:low_stock', alertPayload);
    emitToRole(ROLES.MESS_MANAGER, 'inventory:low_stock', alertPayload);

    for (const manager of managers) {
      await createNotification({
        recipient: manager._id,
        type: 'low_stock_warning',
        title: `Low Stock Alert: ${item.name}`,
        message: `${item.name} has fallen to ${item.currentStock} ${item.unit} (minimum threshold: ${item.minimumThreshold} ${item.unit}). Please arrange replenishment.`,
        actionUrl: '/manager/inventory',
        metadata: { itemId: item._id, currentStock: item.currentStock }
      });
    }
  }

  return { transaction, item };
};

export const getTransactions = async (messId, { itemId, type, limit = 50, page = 1 } = {}) => {
  const query = { mess: messId };
  if (itemId) query.item = itemId;
  if (type) query.type = type;

  const skip = (Math.max(1, page) - 1) * limit;

  const [transactions, total] = await Promise.all([
    StockTransaction.find(query)
      .populate('item', 'name category unit')
      .populate('performedBy', 'firstName lastName role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    StockTransaction.countDocuments(query)
  ]);

  return {
    transactions,
    total,
    page: Number(page),
    pages: Math.ceil(total / limit)
  };
};

export const getLowStockAlerts = async (messId) => {
  return InventoryItem.find({
    mess: messId,
    isActive: true,
    $expr: { $lte: ['$currentStock', '$minimumThreshold'] }
  }).sort({ currentStock: 1 });
};

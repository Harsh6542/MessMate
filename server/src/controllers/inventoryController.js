import * as inventoryService from '../services/inventoryService.js';
import { AppError } from '../utils/AppError.js';

export const createItem = async (req, res, next) => {
  try {
    const messId = req.user.mess;
    if (!messId) {
      throw new AppError('No mess facility assigned to user.', 400, 'NO_MESS');
    }

    const item = await inventoryService.createItem(messId, req.body);

    res.status(201).json({
      status: 'success',
      message: 'Inventory item created successfully.',
      data: { item }
    });
  } catch (error) {
    next(error);
  }
};

export const getItems = async (req, res, next) => {
  try {
    const messId = req.user.mess;
    if (!messId) {
      throw new AppError('No mess facility assigned to user.', 400, 'NO_MESS');
    }

    const items = await inventoryService.getItems(messId, req.query);

    res.status(200).json({
      status: 'success',
      data: { items }
    });
  } catch (error) {
    next(error);
  }
};

export const getItem = async (req, res, next) => {
  try {
    const messId = req.user.mess;
    const item = await inventoryService.getItemById(req.params.id, messId);

    res.status(200).json({
      status: 'success',
      data: { item }
    });
  } catch (error) {
    next(error);
  }
};

export const updateItem = async (req, res, next) => {
  try {
    const messId = req.user.mess;
    const item = await inventoryService.updateItem(req.params.id, messId, req.body);

    res.status(200).json({
      status: 'success',
      message: 'Inventory item updated successfully.',
      data: { item }
    });
  } catch (error) {
    next(error);
  }
};

export const recordTransaction = async (req, res, next) => {
  try {
    const messId = req.user.mess;
    if (!messId) {
      throw new AppError('No mess facility assigned to user.', 400, 'NO_MESS');
    }

    const result = await inventoryService.recordTransaction(messId, req.user._id, req.body);

    res.status(201).json({
      status: 'success',
      message: 'Stock transaction recorded successfully.',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getTransactions = async (req, res, next) => {
  try {
    const messId = req.user.mess;
    if (!messId) {
      throw new AppError('No mess facility assigned to user.', 400, 'NO_MESS');
    }

    const data = await inventoryService.getTransactions(messId, req.query);

    res.status(200).json({
      status: 'success',
      data
    });
  } catch (error) {
    next(error);
  }
};

export const getAlerts = async (req, res, next) => {
  try {
    const messId = req.user.mess;
    if (!messId) {
      throw new AppError('No mess facility assigned to user.', 400, 'NO_MESS');
    }

    const alerts = await inventoryService.getLowStockAlerts(messId);

    res.status(200).json({
      status: 'success',
      data: { alerts }
    });
  } catch (error) {
    next(error);
  }
};

import * as dashboardService from '../services/dashboardService.js';
import { AppError } from '../utils/AppError.js';

export const getStudentDashboard = async (req, res, next) => {
  try {
    const data = await dashboardService.getStudentDashboardData(req.user);
    res.status(200).json({
      success: true,
      status: 'success',
      data
    });
  } catch (error) {
    next(error);
  }
};

export const getStaffDashboard = async (req, res, next) => {
  try {
    const data = await dashboardService.getStaffDashboardData(req.user);
    res.status(200).json({
      success: true,
      status: 'success',
      data
    });
  } catch (error) {
    next(error);
  }
};

export const getManagerDashboard = async (req, res, next) => {
  try {
    const messId = req.user.mess;
    if (!messId) {
      throw new AppError('No mess facility assigned to user.', 400, 'NO_MESS');
    }

    const data = await dashboardService.getManagerDashboardData(messId);
    res.status(200).json({
      success: true,
      status: 'success',
      data
    });
  } catch (error) {
    next(error);
  }
};

export const getWardenDashboard = async (req, res, next) => {
  try {
    const data = await dashboardService.getWardenDashboardData(req.user.hostel, req.user.mess);
    res.status(200).json({
      success: true,
      status: 'success',
      data
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminDashboard = async (req, res, next) => {
  try {
    const data = await dashboardService.getAdminDashboardData();
    res.status(200).json({
      success: true,
      status: 'success',
      data
    });
  } catch (error) {
    next(error);
  }
};


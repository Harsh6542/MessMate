import { asyncHandler } from '../utils/asyncHandler.js';
import {
  generateOrGetCoupon,
  redeemCoupon,
  manualVerifyStudent,
  getStudentWallet,
  payCounterQR,
  getMessCounterQR,
  getMessCounterPayments
} from '../services/couponService.js';

// @desc    Get student coupon wallet details & recent transactions
// @route   GET /api/v1/coupons/wallet
// @access  Student
export const getWallet = asyncHandler(async (req, res) => {
  const data = await getStudentWallet(req.user._id);

  res.status(200).json({
    success: true,
    message: 'Coupon wallet retrieved successfully',
    data
  });
});

// @desc    Student PhonePe / UPI-style Scan & Pay with Mess Coupon (₹500)
// @route   POST /api/v1/coupons/pay-counter
// @access  Student
export const payCounter = asyncHandler(async (req, res) => {
  const { counterQR } = req.body;

  const result = await payCounterQR({
    studentId: req.user._id,
    counterQR
  });

  res.status(200).json({
    success: true,
    message: 'Mess Coupon (₹500) Paid Successfully',
    data: result
  });
});

// @desc    Generate or retrieve active meal coupon
// @route   POST /api/v1/coupons/generate
// @access  Student
export const generateCoupon = asyncHandler(async (req, res) => {
  const { coupon, session, isNew, wallet } = await generateOrGetCoupon(req.user._id);

  res.status(isNew ? 201 : 200).json({
    success: true,
    message: isNew ? 'Digital meal coupon generated successfully' : 'Retrieved active coupon',
    data: {
      coupon,
      session,
      wallet
    }
  });
});

// @desc    Staff scan & redeem (Regular Meal Free or ₹500 Coupon)
// @route   POST /api/v1/coupons/verify
// @access  Mess Staff, Manager, Admin
export const verifyCoupon = asyncHandler(async (req, res) => {
  const { qrPayload, isCoupon } = req.body;

  const result = await redeemCoupon({
    qrData: qrPayload,
    staffId: req.user._id,
    isCoupon: !!isCoupon
  });

  res.status(200).json({
    success: true,
    message: result.message || 'Verification Successful',
    data: result
  });
});

// @desc    Staff manual verification by student Roll Number
// @route   POST /api/v1/coupons/manual-verify
// @access  Mess Staff, Manager, Admin
export const manualVerify = asyncHandler(async (req, res) => {
  const { rollNumber, reason } = req.body;

  const result = await manualVerifyStudent({
    rollNumber,
    staffId: req.user._id,
    reason
  });

  res.status(200).json({
    success: true,
    message: 'Student Attendance Verified Manually',
    data: result
  });
});

// @desc    Get Counter QR Standee details for Staff/Manager
// @route   GET /api/v1/coupons/counter-qr
// @access  Mess Staff, Mess Manager, Admin
export const getCounterQR = asyncHandler(async (req, res) => {
  const data = await getMessCounterQR(req.user._id);

  res.status(200).json({
    success: true,
    message: 'Mess Counter QR retrieved successfully',
    data
  });
});

// @desc    Get live counter payments for Staff/Manager
// @route   GET /api/v1/coupons/counter-payments
// @access  Mess Staff, Mess Manager, Admin
export const getCounterPayments = asyncHandler(async (req, res) => {
  const payments = await getMessCounterPayments(req.user._id);

  res.status(200).json({
    success: true,
    message: 'Counter payments retrieved',
    data: payments
  });
});

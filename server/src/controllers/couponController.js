import { asyncHandler } from '../utils/asyncHandler.js';
import {
  generateOrGetCoupon,
  redeemCoupon,
  manualVerifyStudent
} from '../services/couponService.js';

// @desc    Generate or retrieve active meal coupon
// @route   POST /api/v1/coupons/generate
// @access  Student
export const generateCoupon = asyncHandler(async (req, res) => {
  const { coupon, session, isNew } = await generateOrGetCoupon(req.user._id);

  res.status(isNew ? 201 : 200).json({
    success: true,
    message: isNew ? 'Digital meal coupon generated successfully' : 'Retrieved active coupon',
    data: {
      coupon,
      session
    }
  });
});

// @desc    Staff scan & redeem coupon
// @route   POST /api/v1/coupons/verify
// @access  Mess Staff, Manager, Admin
export const verifyCoupon = asyncHandler(async (req, res) => {
  const { qrPayload } = req.body;

  const result = await redeemCoupon({
    qrData: qrPayload,
    staffId: req.user._id
  });

  res.status(200).json({
    success: true,
    message: 'Meal Verified & Redeemed Successfully',
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


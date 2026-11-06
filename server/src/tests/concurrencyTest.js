import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { Coupon } from '../models/Coupon.js';
import { User } from '../models/User.js';
import { MessFacility } from '../models/MessFacility.js';
import { MealSession } from '../models/MealSession.js';
import { Attendance } from '../models/Attendance.js';
import { generateSecureCouponToken, hashToken } from '../utils/tokenUtils.js';
import { COUPON_STATUS, ROLES, MEAL_TYPES } from '../config/constants.js';

/**
 * Concurrency & Race Condition Verification Test
 *
 * Problem: In a busy college mess with high peak footfall, multiple staff scanners
 * or malicious duplicate QR presentation could attempt to redeem the exact same
 * digital coupon within milliseconds.
 *
 * Solution: MessMate uses atomic MongoDB operations:
 * Coupon.findOneAndUpdate({ tokenHash, status: 'active', expiresAt: { $gt: now } }, { status: 'redeemed' })
 *
 * This test simulates 10 concurrent redemption requests dispatched simultaneously via Promise.all().
 * Expected Result: Exactly 1 succeeds (200), and exactly 9 are rejected (Already Redeemed / Invalid).
 */

const runConcurrencyTest = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/messmate_dev';
    await mongoose.connect(uri);
    console.log('[Test] Connected to MongoDB.');

    // 1. Find or create a test student, staff, and session
    let student = await User.findOne({ role: ROLES.STUDENT });
    let staff = await User.findOne({ role: ROLES.MESS_STAFF });
    let mess = await MessFacility.findOne();

    if (!student || !staff || !mess) {
      console.log('[Test] Missing baseline seed records. Please run "npm run seed" first.');
      process.exit(1);
    }

    const testDate = new Date();
    testDate.setUTCHours(0, 0, 0, 0);

    let session = await MealSession.findOne({ mess: mess._id, date: testDate });
    if (!session) {
      session = await MealSession.create({
        mess: mess._id,
        date: testDate,
        mealType: MEAL_TYPES.LUNCH,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        cutoffTime: new Date(Date.now() - 1000)
      });
    }

    // 2. Generate a secure cryptographic coupon
    const rawToken = generateSecureCouponToken();
    const tokenHash = hashToken(rawToken);

    // Delete existing coupons for this student and session to ensure clean state
    await Coupon.deleteMany({ student: student._id, mealSession: session._id });

    const coupon = await Coupon.create({
      student: student._id,
      mealSession: session._id,
      tokenHash,
      qrPayload: `MESSMATE:COUPON:${rawToken}`,
      status: COUPON_STATUS.ACTIVE,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 mins validity
    });

    console.log(`[Test] Created active test coupon ID: ${coupon._id}`);
    console.log(`[Test] Simulating 10 simultaneous redemption requests with token: ${rawToken.slice(0, 10)}...`);

    // 3. Define the atomic redemption operation
    const redeemCouponAttempt = async (attemptIndex) => {
      const now = new Date();
      const redeemed = await Coupon.findOneAndUpdate(
        {
          tokenHash,
          status: COUPON_STATUS.ACTIVE,
          expiresAt: { $gt: now }
        },
        {
          $set: {
            status: COUPON_STATUS.REDEEMED,
            redeemedAt: now,
            redeemedBy: staff._id
          }
        },
        { new: true }
      );

      if (redeemed) {
        return { attemptIndex, success: true, message: 'COUPON_REDEEMED_SUCCESSFULLY' };
      } else {
        return { attemptIndex, success: false, message: 'REJECTED_ALREADY_REDEEMED_OR_EXPIRED' };
      }
    };

    // 4. Fire 10 concurrent requests simultaneously
    const attempts = Array.from({ length: 10 }, (_, i) => redeemCouponAttempt(i + 1));
    const results = await Promise.all(attempts);

    // 5. Evaluate and output audit results
    const successfulAttempts = results.filter((r) => r.success);
    const rejectedAttempts = results.filter((r) => !r.success);

    console.log('\n--- CONCURRENCY TEST RESULTS ---');
    console.table(results);

    console.log(`Successful redemptions: ${successfulAttempts.length} (Expected: 1)`);
    console.log(`Rejected duplicate requests: ${rejectedAttempts.length} (Expected: 9)`);

    if (successfulAttempts.length === 1 && rejectedAttempts.length === 9) {
      console.log('\n✅ PASS: Atomic database locking successfully prevented double-serving race condition!\n');
    } else {
      console.error('\n❌ FAIL: Race condition detected! More than one concurrent redemption succeeded.\n');
    }

    // Clean up test coupon
    await Coupon.findByIdAndDelete(coupon._id);

    process.exit(successfulAttempts.length === 1 ? 0 : 1);
  } catch (error) {
    console.error('[Test Error]', error);
    process.exit(1);
  }
};

runConcurrencyTest();


import { User } from '../models/User.js';
import { MealDeclaration } from '../models/MealDeclaration.js';
import { Coupon } from '../models/Coupon.js';
import { Attendance } from '../models/Attendance.js';
import { Feedback } from '../models/Feedback.js';
import { GuestMealRequest } from '../models/GuestMealRequest.js';
import { Complaint } from '../models/Complaint.js';
import { ROLES } from '../config/constants.js';

// Protected official demo/system accounts that must NEVER be deleted
export const PROTECTED_EMAILS = [
  'admin@messmate.edu',
  'manager@messmate.edu',
  'manager.kadambini@messmate.edu',
  'manager.nagarjuna@messmate.edu',
  'manager.aryabhatta@messmate.edu',
  'staff@messmate.edu',
  'staff2@messmate.edu',
  'staff.kadambini@messmate.edu',
  'staff.nagarjuna@messmate.edu',
  'staff.aryabhatta@messmate.edu',
  'student@messmate.edu',
  'priya.kumari@messmate.edu'
];

/**
 * Removes all synthetic/mock dummy students generated during development seeding
 * while keeping:
 *  1. Protected demo personas (Ayush Singh, Priya Kumari, Staff Raju, Manager Suresh, Super Admin)
 *  2. All Hostels, Mess facilities, weekly menus, and inventory commodities
 *  3. Any real student who registered independently
 */
export const cleanupDummyUsers = async () => {
  try {
    // Find all dummy users:
    // Any student account ending with @nitp.ac.in (or with firstName/lastName from synthetic seed list)
    // that is NOT in the PROTECTED_EMAILS list.
    const dummyQuery = {
      role: ROLES.STUDENT,
      email: { $nin: PROTECTED_EMAILS },
      $or: [
        { email: { $regex: /@nitp\.ac\.in$/i } },
        { rollNumber: { $in: [
          '2201001', '2201002', '2201004', '2201005', '2201006', '2201007',
          '2201008', '2201009', '2201011', '2201012', '2201013', '2201014',
          '2201015', '2201016', '2201017', '2201018', '2201019', '2201020',
          '2201021', '2201022', '2201023', '2201024', '2201025', '2201026',
          '2201027', '2201028', '2201029', '2201030'
        ] } }
      ]
    };

    const dummyUsers = await User.find(dummyQuery).select('_id email rollNumber firstName lastName');

    if (!dummyUsers || dummyUsers.length === 0) {
      console.log('[Cleanup] No dummy users found. Database is already clean and operational.');
      return { purgedCount: 0, message: 'Database is already clean and operational.' };
    }

    const dummyIds = dummyUsers.map((u) => u._id);
    console.log(`[Cleanup] Found ${dummyUsers.length} dummy users to purge from database...`);

    // Delete associated orphaned records for these dummy accounts
    const [delDeclarations, delCoupons, delAttendance, delFeedback, delGuests, delComplaints, delUsers] = await Promise.all([
      MealDeclaration.deleteMany({ student: { $in: dummyIds } }),
      Coupon.deleteMany({ student: { $in: dummyIds } }),
      Attendance.deleteMany({ student: { $in: dummyIds } }),
      Feedback.deleteMany({ student: { $in: dummyIds } }),
      GuestMealRequest.deleteMany({ student: { $in: dummyIds } }),
      Complaint.deleteMany({ complainant: { $in: dummyIds } }),
      User.deleteMany({ _id: { $in: dummyIds } })
    ]);

    console.log(`[Cleanup] Purge complete! Removed:`);
    console.log(` - ${delUsers.deletedCount} dummy student accounts`);
    console.log(` - ${delDeclarations.deletedCount} meal declarations`);
    console.log(` - ${delCoupons.deletedCount} coupons`);
    console.log(` - ${delAttendance.deletedCount} attendance records`);
    console.log(` - ${delFeedback.deletedCount} feedback entries`);
    console.log(` - ${delGuests.deletedCount} guest meal requests`);
    console.log(` - ${delComplaints.deletedCount} complaints`);
    console.log(`[Cleanup] MessMate database is now fresh and ready for real mess operations!`);

    return {
      purgedCount: delUsers.deletedCount,
      details: {
        users: delUsers.deletedCount,
        declarations: delDeclarations.deletedCount,
        coupons: delCoupons.deletedCount,
        attendance: delAttendance.deletedCount,
        feedback: delFeedback.deletedCount
      },
      message: `Successfully purged ${delUsers.deletedCount} dummy users and associated test records. Database is fresh and operational.`
    };
  } catch (error) {
    console.error('[Cleanup Error] Failed to purge dummy users:', error.message);
    throw error;
  }
};


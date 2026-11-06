import { User } from '../models/User.js';
import { Hostel } from '../models/Hostel.js';
import { MessFacility } from '../models/MessFacility.js';
import { MealSession } from '../models/MealSession.js';
import { MealDeclaration } from '../models/MealDeclaration.js';
import { Coupon } from '../models/Coupon.js';
import { Attendance } from '../models/Attendance.js';
import { Feedback } from '../models/Feedback.js';
import { Complaint } from '../models/Complaint.js';
import { Announcement } from '../models/Announcement.js';
import { WasteLog } from '../models/WasteLog.js';
import { InventoryItem } from '../models/InventoryItem.js';
import { GuestMealRequest } from '../models/GuestMealRequest.js';
import { Menu } from '../models/Menu.js';
import { getCurrentOrNextMealSession, normalizeDate, ensureDailySessions } from './mealSessionService.js';
import { ROLES, DECLARATION_STATUS, COUPON_STATUS } from '../config/constants.js';

/**
 * 1. STUDENT DASHBOARD
 */
export const getStudentDashboardData = async (user) => {
  const messId = user.mess;
  const hostelId = user.hostel;

  // 1. Current or next upcoming meal session
  let nextSessionInfo = null;
  let todayMenu = null;
  let hasActiveCoupon = false;
  let hasDeclaredOptOut = false;

  if (messId) {
    const sessionRes = await getCurrentOrNextMealSession(messId);
    if (sessionRes?.session) {
      const sess = sessionRes.session;
      nextSessionInfo = {
        sessionId: sess._id,
        mealType: sess.mealType,
        date: sess.date,
        startTime: sess.startTime,
        endTime: sess.endTime,
        cutoffTime: sess.cutoffTime,
        isActive: sessionRes.isActive
      };

      // Get Menu for this meal
      const dayOfWeek = new Date(sess.date).getUTCDay();
      const menu = await Menu.findOne({
        mess: messId,
        dayOfWeek,
        mealType: sess.mealType,
        isActive: true
      });
      todayMenu = menu ? { title: menu.title, dishes: menu.dishes } : null;

      // Check if student has active coupon for this session
      const coupon = await Coupon.findOne({
        student: user._id,
        mealSession: sess._id,
        status: COUPON_STATUS.ACTIVE
      });
      hasActiveCoupon = !!coupon;

      // Check if student opted out
      const declaration = await MealDeclaration.findOne({
        student: user._id,
        mess: messId,
        date: sess.date,
        mealType: sess.mealType,
        status: DECLARATION_STATUS.DECLARED
      });
      hasDeclaredOptOut = !!declaration;
    }
  }

  // 2. Attendance stats in past 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);

  const [attendedMealsCount, totalOptOutsCount] = await Promise.all([
    Attendance.countDocuments({
      student: user._id,
      verifiedAt: { $gte: thirtyDaysAgo }
    }),
    MealDeclaration.countDocuments({
      student: user._id,
      status: DECLARATION_STATUS.DECLARED,
      date: { $gte: thirtyDaysAgo }
    })
  ]);

  // 3. Active guest meal bookings
  const guestRequests = await GuestMealRequest.find({
    requestedBy: user._id,
    date: { $gte: normalizeDate() }
  }).sort({ date: 1 }).limit(5);

  // 4. Recent grievances / complaints
  const recentComplaints = await Complaint.find({ student: user._id })
    .sort({ createdAt: -1 })
    .limit(4);

  // 5. Active announcements
  const announcements = await Announcement.find({
    isActive: true,
    $or: [{ targetMess: null, targetHostel: null }, { targetMess: messId }, { targetHostel: hostelId }]
  })
    .sort({ isPinned: -1, createdAt: -1 })
    .limit(4);

  return {
    user: {
      firstName: user.firstName,
      lastName: user.lastName,
      rollNumber: user.rollNumber,
      roomNumber: user.roomNumber,
      hostelName: user.hostel?.name || 'Hostel Assigned',
      messName: user.mess?.name || 'Mess Assigned'
    },
    nextSession: nextSessionInfo,
    todayMenu,
    hasActiveCoupon,
    hasDeclaredOptOut,
    attendanceStats: {
      attendedPast30Days: attendedMealsCount,
      optOutsPast30Days: totalOptOutsCount
    },
    guestRequests,
    recentComplaints,
    announcements
  };
};

/**
 * 2. MESS STAFF DASHBOARD
 */
export const getStaffDashboardData = async (staffUser) => {
  const messId = staffUser.mess;
  if (!messId) return {};

  const now = new Date();
  const today = normalizeDate(now);

  // Ensure daily sessions
  const dailySessions = await ensureDailySessions(messId, today);
  const currentSessionRes = await getCurrentOrNextMealSession(messId);
  const activeSess = currentSessionRes?.session;

  // Active session stats
  const activeStats = activeSess
    ? {
        sessionId: activeSess._id,
        mealType: activeSess.mealType,
        startTime: activeSess.startTime,
        endTime: activeSess.endTime,
        isActive: currentSessionRes.isActive,
        declaredDemand: activeSess.managerAdjustedQuantity || activeSess.declaredDemand,
        actualServedCount: activeSess.actualServedCount,
        percentageServed:
          (activeSess.managerAdjustedQuantity || activeSess.declaredDemand) > 0
            ? Math.round(
                (activeSess.actualServedCount /
                  (activeSess.managerAdjustedQuantity || activeSess.declaredDemand)) *
                  100
              )
            : 0,
        remainingExpected: Math.max(
          0,
          (activeSess.managerAdjustedQuantity || activeSess.declaredDemand) -
            activeSess.actualServedCount
        )
      }
    : null;

  // Today shift breakdown
  const todayBreakdown = dailySessions.map((s) => ({
    sessionId: s._id,
    mealType: s.mealType,
    status: s.status,
    declaredDemand: s.managerAdjustedQuantity || s.declaredDemand,
    actualServedCount: s.actualServedCount
  }));

  // Recent 12 scans in this mess
  const recentScans = await Attendance.find({ mess: messId })
    .populate('student', 'firstName lastName rollNumber roomNumber')
    .sort({ verifiedAt: -1 })
    .limit(12);

  // Check if waste log is pending for today's most recently passed session
  const completedSessions = dailySessions.filter((s) => new Date(s.endTime) < now);
  let pendingWasteLogSession = null;
  for (const s of completedSessions) {
    const log = await WasteLog.findOne({ mealSession: s._id });
    if (!log) {
      pendingWasteLogSession = {
        sessionId: s._id,
        mealType: s.mealType
      };
      break;
    }
  }

  return {
    activeSession: activeStats,
    todayBreakdown,
    recentScans,
    pendingWasteLogSession
  };
};

/**
 * 3. MESS MANAGER COMMAND CENTER
 */
export const getManagerDashboardData = async (messId) => {
  if (!messId) return {};

  const now = new Date();
  const today = normalizeDate(now);

  // 1. Today's Sessions Overview
  const todaySessions = await ensureDailySessions(messId, today);
  const totalPreparedToday = todaySessions.reduce(
    (acc, s) => acc + (s.managerAdjustedQuantity || s.declaredDemand || 0),
    0
  );
  const totalServedToday = todaySessions.reduce((acc, s) => acc + (s.actualServedCount || 0), 0);

  // 2. Past 7 days attendance vs demand trend
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);

  const pastWeekSessions = await MealSession.find({
    mess: messId,
    date: { $gte: sevenDaysAgo, $lte: today }
  }).sort({ date: 1, mealType: 1 });

  // Group by date
  const dateMap = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setUTCDate(d.getUTCDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    dateMap[dateStr] = {
      date: dateStr,
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      declaredDemand: 0,
      actualServed: 0
    };
  }

  pastWeekSessions.forEach((s) => {
    const dateStr = new Date(s.date).toISOString().split('T')[0];
    if (dateMap[dateStr]) {
      dateMap[dateStr].declaredDemand += s.managerAdjustedQuantity || s.declaredDemand || 0;
      dateMap[dateStr].actualServed += s.actualServedCount || 0;
    }
  });

  const attendanceTrend = Object.values(dateMap);

  // 3. Past 7 days wastage trend
  const pastWeekWaste = await WasteLog.find({
    mess: messId,
    createdAt: { $gte: sevenDaysAgo }
  }).populate('mealSession', 'date mealType');

  const wasteDateMap = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setUTCDate(d.getUTCDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    wasteDateMap[dateStr] = {
      date: dateStr,
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      surplusKg: 0,
      plateWasteKg: 0,
      costLost: 0
    };
  }

  pastWeekWaste.forEach((w) => {
    const dateStr = w.mealSession?.date
      ? new Date(w.mealSession.date).toISOString().split('T')[0]
      : new Date(w.createdAt).toISOString().split('T')[0];
    if (wasteDateMap[dateStr]) {
      wasteDateMap[dateStr].surplusKg += w.unservedSurplusWeightKg || 0;
      wasteDateMap[dateStr].plateWasteKg += w.plateWasteWeightKg || 0;
      wasteDateMap[dateStr].costLost += w.estimatedCostLostINR || 0;
    }
  });

  const wastageTrend = Object.values(wasteDateMap);

  // 4. Quality ratings summary (past 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);

  const feedbacks = await Feedback.find({
    mess: messId,
    createdAt: { $gte: thirtyDaysAgo }
  });

  let qualityScores = {
    overall: 0,
    taste: 0,
    hygiene: 0,
    temperature: 0,
    portion: 0,
    totalReviews: feedbacks.length
  };

  if (feedbacks.length > 0) {
    const sums = feedbacks.reduce(
      (acc, f) => {
        acc.overall += f.ratings?.overall || 0;
        acc.taste += f.ratings?.taste || 0;
        acc.hygiene += f.ratings?.hygiene || 0;
        acc.temperature += f.ratings?.temperature || 0;
        acc.portion += f.ratings?.portion || 0;
        return acc;
      },
      { overall: 0, taste: 0, hygiene: 0, temperature: 0, portion: 0 }
    );

    qualityScores = {
      overall: Number((sums.overall / feedbacks.length).toFixed(1)),
      taste: Number((sums.taste / feedbacks.length).toFixed(1)),
      hygiene: Number((sums.hygiene / feedbacks.length).toFixed(1)),
      temperature: Number((sums.temperature / feedbacks.length).toFixed(1)),
      portion: Number((sums.portion / feedbacks.length).toFixed(1)),
      totalReviews: feedbacks.length
    };
  }

  // 5. Inventory Low-Stock Alerts
  const lowStockItems = await InventoryItem.find({
    mess: messId,
    isActive: true,
    $expr: { $lte: ['$currentStock', '$minimumThreshold'] }
  }).sort({ currentStock: 1 });

  // 6. Pending Complaints & Guest Tickets
  const [pendingComplaintsCount, urgentComplaints, pendingGuestRequestsCount] =
    await Promise.all([
      Complaint.countDocuments({
        mess: messId,
        status: { $in: ['submitted', 'under_review', 'in_progress'] }
      }),
      Complaint.find({
        mess: messId,
        status: { $in: ['submitted', 'under_review', 'in_progress'] },
        priority: { $in: ['critical', 'high'] }
      })
        .populate('student', 'firstName lastName rollNumber')
        .sort({ priority: 1, createdAt: -1 })
        .limit(5),
      GuestMealRequest.countDocuments({
        mess: messId,
        status: 'pending'
      })
    ]);

  return {
    today: {
      totalPrepared: totalPreparedToday,
      totalServed: totalServedToday,
      sessions: todaySessions
    },
    attendanceTrend,
    wastageTrend,
    qualityScores,
    inventory: {
      lowStockCount: lowStockItems.length,
      alerts: lowStockItems.slice(0, 5)
    },
    complaints: {
      pendingCount: pendingComplaintsCount,
      urgent: urgentComplaints
    },
    pendingGuestRequestsCount
  };
};

/**
 * 4. WARDEN / COMMITTEE OVERSIGHT PORTAL
 */
export const getWardenDashboardData = async (hostelId, messId) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);

  const queryMess = messId ? { mess: messId } : {};

  // 1. Overall Satisfaction & Feedbacks
  const feedbacks = await Feedback.find({
    ...queryMess,
    createdAt: { $gte: thirtyDaysAgo }
  });

  const avgRating =
    feedbacks.length > 0
      ? Number(
          (
            feedbacks.reduce((acc, f) => acc + (f.ratings?.overall || 0), 0) /
            feedbacks.length
          ).toFixed(2)
        )
      : 4.2;

  // 2. Complaints SLA Compliance & Performance
  const complaints = await Complaint.find({
    ...(hostelId ? { hostel: hostelId } : queryMess),
    createdAt: { $gte: thirtyDaysAgo }
  });

  const totalComplaints = complaints.length;
  const resolvedComplaints = complaints.filter((c) => ['resolved', 'closed'].includes(c.status));
  const resolutionRate =
    totalComplaints > 0 ? Math.round((resolvedComplaints.length / totalComplaints) * 100) : 100;

  // Check overdue SLA complaints
  const now = new Date();
  const overdueCount = complaints.filter(
    (c) => ['submitted', 'under_review', 'in_progress'].includes(c.status) && new Date(c.slaDeadline) < now
  ).length;

  const confidentialCount = complaints.filter((c) => c.isConfidential).length;

  // 3. 30-day Wastage Totals
  const wasteLogs = await WasteLog.find({
    ...queryMess,
    createdAt: { $gte: thirtyDaysAgo }
  });

  const totalWasteKg = wasteLogs.reduce(
    (acc, w) => acc + (w.unservedSurplusWeightKg || 0) + (w.plateWasteWeightKg || 0),
    0
  );
  const totalCostLostINR = wasteLogs.reduce((acc, w) => acc + (w.estimatedCostLostINR || 0), 0);

  // 4. Weekly Quality Trend over past 4 weeks
  const weeklyTrends = [];
  for (let i = 3; i >= 0; i--) {
    const weekStart = new Date();
    weekStart.setUTCDate(weekStart.getUTCDate() - (i + 1) * 7);
    const weekEnd = new Date();
    weekEnd.setUTCDate(weekEnd.getUTCDate() - i * 7);

    const weekFeedbacks = feedbacks.filter(
      (f) => new Date(f.createdAt) >= weekStart && new Date(f.createdAt) < weekEnd
    );

    const weekAvg =
      weekFeedbacks.length > 0
        ? Number(
            (
              weekFeedbacks.reduce((acc, f) => acc + (f.ratings?.overall || 0), 0) /
              weekFeedbacks.length
            ).toFixed(1)
          )
        : avgRating;

    weeklyTrends.push({
      week: `Week ${4 - i}`,
      rating: weekAvg,
      reviews: weekFeedbacks.length
    });
  }

  // 5. Recent escalated or confidential complaints requiring warden review
  const oversightComplaints = await Complaint.find({
    ...(hostelId ? { hostel: hostelId } : queryMess)
  })
    .populate('student', 'firstName lastName rollNumber')
    .sort({ isConfidential: -1, priority: 1, createdAt: -1 })
    .limit(6);

  return {
    satisfactionIndex: avgRating,
    totalReviewsPast30Days: feedbacks.length,
    weeklyTrends,
    complaintsSummary: {
      total: totalComplaints,
      resolved: resolvedComplaints.length,
      resolutionRate,
      overdueCount,
      confidentialCount
    },
    wastageSummary: {
      totalWasteKg: Math.round(totalWasteKg * 10) / 10,
      totalCostLostINR: Math.round(totalCostLostINR),
      totalLogs: wasteLogs.length
    },
    oversightComplaints
  };
};

/**
 * 5. SUPER ADMIN PLATFORM AUDIT CONSOLE
 */
export const getAdminDashboardData = async () => {
  const [
    totalUsers,
    studentsCount,
    staffCount,
    managersCount,
    wardensCount,
    hostelsCount,
    messesCount,
    totalMealsServed,
    totalComplaints,
    totalWasteLogs
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: ROLES.STUDENT }),
    User.countDocuments({ role: ROLES.MESS_STAFF }),
    User.countDocuments({ role: ROLES.MESS_MANAGER }),
    User.countDocuments({ role: ROLES.WARDEN }),
    Hostel.countDocuments(),
    MessFacility.countDocuments(),
    Attendance.countDocuments(),
    Complaint.countDocuments(),
    WasteLog.countDocuments()
  ]);

  // Aggregate total food waste kg and financial loss
  const wasteAgg = await WasteLog.aggregate([
    {
      $group: {
        _id: null,
        totalSurplus: { $sum: '$unservedSurplusWeightKg' },
        totalPlate: { $sum: '$plateWasteWeightKg' },
        totalCost: { $sum: '$estimatedCostLostINR' }
      }
    }
  ]);

  const totalWasteKg = wasteAgg[0]
    ? Math.round((wasteAgg[0].totalSurplus + wasteAgg[0].totalPlate) * 10) / 10
    : 0;
  const totalCostLostINR = wasteAgg[0] ? Math.round(wasteAgg[0].totalCost) : 0;

  // Recent registered users
  const recentUsers = await User.find()
    .populate('hostel', 'name code')
    .populate('mess', 'name')
    .sort({ createdAt: -1 })
    .limit(10);

  // Hostels list with active residents
  const hostels = await Hostel.find({ isActive: true }).sort({ name: 1 });
  const hostelsWithCounts = await Promise.all(
    hostels.map(async (h) => {
      const residents = await User.countDocuments({ hostel: h._id, role: ROLES.STUDENT });
      return {
        ...h.toObject(),
        residentsCount: residents
      };
    })
  );

  return {
    counts: {
      totalUsers,
      students: studentsCount,
      staff: staffCount,
      managers: managersCount,
      wardens: wardensCount,
      hostels: hostelsCount,
      messes: messesCount,
      totalMealsServed,
      totalComplaints,
      totalWasteLoggedKg: totalWasteKg,
      totalCostLostINR
    },
    recentUsers,
    hostels: hostelsWithCounts,
    systemInfo: {
      nodeEnv: process.env.NODE_ENV || 'development',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString()
    }
  };
};

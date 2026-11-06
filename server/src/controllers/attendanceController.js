import { Attendance } from '../models/Attendance.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// @desc    Get student's own attendance history
// @route   GET /api/v1/attendance/my-history
// @access  Student
export const getMyAttendance = asyncHandler(async (req, res) => {
  const attendance = await Attendance.find({ student: req.user._id })
    .populate('mealSession', 'date mealType startTime endTime')
    .sort({ timestamp: -1 })
    .limit(30);

  res.status(200).json({
    success: true,
    data: {
      attendance
    }
  });
});

// @desc    Get attendance for a specific session
// @route   GET /api/v1/attendance/session/:sessionId
// @access  Mess Staff, Manager, Warden, Admin
export const getSessionAttendance = asyncHandler(async (req, res) => {
  const attendance = await Attendance.find({ mealSession: req.params.sessionId })
    .populate('student', 'firstName lastName rollNumber phone')
    .populate('verifiedBy', 'firstName lastName role')
    .sort({ timestamp: -1 });

  res.status(200).json({
    success: true,
    data: {
      attendance,
      count: attendance.length
    }
  });
});


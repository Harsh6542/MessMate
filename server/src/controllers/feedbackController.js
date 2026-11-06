import { Feedback } from '../models/Feedback.js';
import { Attendance } from '../models/Attendance.js';
import { MealSession } from '../models/MealSession.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// @desc    Submit 5-star meal review (enforces attendance verification)
// @route   POST /api/v1/feedback
// @access  Student
export const submitFeedback = asyncHandler(async (req, res, next) => {
  const { mealSessionId, ratings, comment } = req.body;

  // 1. Verify student attended this meal session!
  const attendance = await Attendance.findOne({
    student: req.user._id,
    mealSession: mealSessionId
  });

  if (!attendance) {
    return next(
      new AppError(
        'Verified meal attendance is required to submit feedback. You have not attended this meal.',
        400,
        'ATTENDANCE_REQUIRED'
      )
    );
  }

  // 2. Prevent duplicate reviews for the same meal session
  const existingReview = await Feedback.findOne({
    student: req.user._id,
    mealSession: mealSessionId
  });

  if (existingReview) {
    return next(
      new AppError('You have already submitted a rating for this meal session.', 400, 'ALREADY_REVIEWED')
    );
  }

  // Check if comment or ratings indicate urgent health/safety issue
  const isFlagged =
    ratings.overall <= 2 ||
    /food poisoning|worm|insect|hair|stale|smelly|raw/i.test(comment || '');

  const feedback = await Feedback.create({
    student: req.user._id,
    mealSession: mealSessionId,
    attendance: attendance._id,
    ratings,
    comment,
    isFlagged
  });

  res.status(201).json({
    success: true,
    message: 'Thank you for your feedback! It helps improve mess quality.',
    data: {
      feedback
    }
  });
});

// @desc    Get student's own feedback history
// @route   GET /api/v1/feedback/my
// @access  Student
export const getMyFeedback = asyncHandler(async (req, res) => {
  const feedback = await Feedback.find({ student: req.user._id })
    .populate('mealSession', 'date mealType')
    .sort({ createdAt: -1 })
    .limit(30);

  res.status(200).json({
    success: true,
    data: {
      feedback
    }
  });
});

// @desc    Get feedback scorecard for a meal session
// @route   GET /api/v1/feedback/session/:sessionId
// @access  Mess Manager, Warden, Admin
export const getSessionFeedback = asyncHandler(async (req, res) => {
  const reviews = await Feedback.find({ mealSession: req.params.sessionId })
    .populate('student', 'firstName lastName rollNumber')
    .sort({ createdAt: -1 });

  // Calculate rating averages
  let totalTaste = 0;
  let totalHygiene = 0;
  let totalTemp = 0;
  let totalPortion = 0;
  let totalOverall = 0;

  reviews.forEach((r) => {
    totalTaste += r.ratings.taste;
    totalHygiene += r.ratings.hygiene;
    totalTemp += r.ratings.temperature;
    totalPortion += r.ratings.portionSize;
    totalOverall += r.ratings.overall;
  });

  const count = reviews.length;
  const averages = count
    ? {
        taste: (totalTaste / count).toFixed(1),
        hygiene: (totalHygiene / count).toFixed(1),
        temperature: (totalTemp / count).toFixed(1),
        portionSize: (totalPortion / count).toFixed(1),
        overall: (totalOverall / count).toFixed(1)
      }
    : null;

  res.status(200).json({
    success: true,
    data: {
      count,
      averages,
      reviews
    }
  });
});

// @desc    Manager response to student feedback
// @route   POST /api/v1/feedback/:id/response
// @access  Mess Manager
export const respondToFeedback = asyncHandler(async (req, res, next) => {
  const { text } = req.body;

  const feedback = await Feedback.findById(req.params.id);
  if (!feedback) {
    return next(new AppError('Feedback record not found.', 404, 'NOT_FOUND'));
  }

  feedback.managerResponse = {
    text: text.trim(),
    respondedAt: new Date(),
    respondedBy: req.user._id
  };
  await feedback.save();

  res.status(200).json({
    success: true,
    message: 'Response posted successfully.',
    data: {
      feedback
    }
  });
});


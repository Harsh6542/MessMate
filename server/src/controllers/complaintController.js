import { Complaint } from '../models/Complaint.js';
import { MessFacility } from '../models/MessFacility.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  submitComplaint,
  addComplaintResponse,
  reopenComplaint
} from '../services/complaintService.js';
import { ROLES, COMPLAINT_STATUS } from '../config/constants.js';

// @desc    Lodge a new grievance ticket
// @route   POST /api/v1/complaints
// @access  Student
export const createComplaint = asyncHandler(async (req, res, next) => {
  const { category, priority, subject, description, images, isConfidential } = req.body;

  const messId = req.user.mess || (await MessFacility.findOne({ hostel: req.user.hostel }))?._id;
  if (!messId) {
    return next(new AppError('No mess facility mapped to student profile.', 400, 'NO_MESS_FOUND'));
  }

  const complaint = await submitComplaint({
    complainantId: req.user._id,
    messId,
    category,
    priority,
    subject,
    description,
    images: images || [],
    isConfidential: !!isConfidential
  });

  res.status(201).json({
    success: true,
    message: `Grievance registered under ID: ${complaint.complaintId}`,
    data: {
      complaint
    }
  });
});

// @desc    List complaints (scoped by role with confidentiality protection)
// @route   GET /api/v1/complaints
// @access  Authenticated
export const getComplaints = asyncHandler(async (req, res) => {
  const { status, category, priority, page = 1, limit = 20 } = req.query;

  const query = {};

  // Scope query based on role
  if (req.user.role === ROLES.STUDENT) {
    query.complainant = req.user._id;
  } else if (req.user.role === ROLES.MESS_MANAGER || req.user.role === ROLES.MESS_STAFF) {
    query.mess = req.user.mess;
  }

  if (status) query.status = status;
  if (category) query.category = category;
  if (priority) query.priority = priority;

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const total = await Complaint.countDocuments(query);
  let complaints = await Complaint.find(query)
    .populate('complainant', 'firstName lastName rollNumber avatarUrl')
    .populate('assignedTo', 'firstName lastName')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  // Redact student personal identity from mess managers/staff if confidential
  if (req.user.role === ROLES.MESS_MANAGER || req.user.role === ROLES.MESS_STAFF) {
    complaints = complaints.map((c) => {
      const doc = c.toObject();
      if (doc.isConfidential) {
        doc.complainant = { firstName: 'Anonymous', lastName: 'Student', rollNumber: 'REDACTED' };
      }
      return doc;
    });
  }

  res.status(200).json({
    success: true,
    data: {
      complaints
    },
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }
  });
});

// @desc    Get complaint details with response thread
// @route   GET /api/v1/complaints/:id
// @access  Authenticated
export const getComplaintById = asyncHandler(async (req, res, next) => {
  const complaint = await Complaint.findById(req.params.id)
    .populate('complainant', 'firstName lastName rollNumber phone avatarUrl')
    .populate('mess', 'name')
    .populate('assignedTo', 'firstName lastName')
    .populate('responses.by', 'firstName lastName role');

  if (!complaint) {
    return next(new AppError('Complaint not found.', 404, 'NOT_FOUND'));
  }

  // Security check: Student can only view their own complaint
  if (
    req.user.role === ROLES.STUDENT &&
    complaint.complainant._id.toString() !== req.user._id.toString()
  ) {
    return next(new AppError('Unauthorized to view this complaint.', 403, 'FORBIDDEN'));
  }

  const result = complaint.toObject();

  // Hide internal staff notes from student view
  if (req.user.role === ROLES.STUDENT) {
    result.responses = result.responses.filter((r) => !r.isInternal);
  }

  // Redact student identity if confidential and viewed by manager/staff
  if (
    result.isConfidential &&
    (req.user.role === ROLES.MESS_MANAGER || req.user.role === ROLES.MESS_STAFF)
  ) {
    result.complainant = { firstName: 'Anonymous', lastName: 'Student', rollNumber: 'REDACTED' };
  }

  res.status(200).json({
    success: true,
    data: {
      complaint: result
    }
  });
});

// @desc    Add response to complaint or update status
// @route   POST /api/v1/complaints/:id/respond
// @access  Mess Manager, Warden, Admin
export const respondToComplaint = asyncHandler(async (req, res) => {
  const { message, isInternal, newStatus } = req.body;

  const complaint = await addComplaintResponse({
    complaintId: req.params.id,
    userId: req.user._id,
    userRole: req.user.role,
    message,
    isInternal,
    newStatus
  });

  res.status(200).json({
    success: true,
    message: 'Response posted successfully.',
    data: {
      complaint
    }
  });
});

// @desc    Update complaint status
// @route   PUT /api/v1/complaints/:id/status
// @access  Mess Manager, Warden, Admin
export const updateComplaintStatus = asyncHandler(async (req, res, next) => {
  const { status, resolutionDeadline } = req.body;

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) {
    return next(new AppError('Complaint not found.', 404, 'NOT_FOUND'));
  }

  if (status) complaint.status = status;
  if (resolutionDeadline) complaint.resolutionDeadline = new Date(resolutionDeadline);
  if (status === COMPLAINT_STATUS.RESOLVED || status === COMPLAINT_STATUS.CLOSED) {
    complaint.resolvedAt = new Date();
  }

  await complaint.save();

  res.status(200).json({
    success: true,
    message: 'Complaint status updated.',
    data: {
      complaint
    }
  });
});

// @desc    Student reopens complaint
// @route   POST /api/v1/complaints/:id/reopen
// @access  Student
export const reopenStudentComplaint = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const complaint = await reopenComplaint(req.params.id, req.user._id, reason);

  res.status(200).json({
    success: true,
    message: 'Complaint has been reopened.',
    data: {
      complaint
    }
  });
});


import { Complaint } from '../models/Complaint.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { createNotification } from './notificationService.js';
import { emitToRoom } from '../sockets/index.js';
import { COMPLAINT_STATUS, COMPLAINT_PRIORITIES, ROLES } from '../config/constants.js';

// Auto-generate human readable ID like CMP-2026-0001
export const generateComplaintId = async () => {
  const currentYear = new Date().getFullYear();
  const count = await Complaint.countDocuments();
  const sequence = String(count + 1).padStart(4, '0');
  return `CMP-${currentYear}-${sequence}`;
};

/**
 * Submit a new grievance ticket
 */
export const submitComplaint = async ({
  complainantId,
  messId,
  category,
  priority = COMPLAINT_PRIORITIES.MEDIUM,
  subject,
  description,
  images = [],
  isConfidential = false
}) => {
  const complaintId = await generateComplaintId();

  // Determine SLA resolution deadline
  let deadlineHours = 48; // Standard 48 hours
  if (priority === COMPLAINT_PRIORITIES.HIGH) deadlineHours = 24;
  if (priority === COMPLAINT_PRIORITIES.CRITICAL || category === 'food_quality') deadlineHours = 12;

  const resolutionDeadline = new Date(Date.now() + deadlineHours * 60 * 60 * 1000);

  const complaint = await Complaint.create({
    complaintId,
    complainant: complainantId,
    mess: messId,
    category,
    priority,
    subject,
    description,
    images,
    isConfidential,
    resolutionDeadline,
    status: COMPLAINT_STATUS.SUBMITTED
  });

  // Notify Mess Manager and Warden in real-time
  emitToRoom(`mess:${messId.toString()}`, 'complaint:new', {
    complaintId: complaint.complaintId,
    category: complaint.category,
    priority: complaint.priority,
    subject: complaint.subject
  });

  return complaint;
};

/**
 * Add response/update to complaint thread
 */
export const addComplaintResponse = async ({
  complaintId,
  userId,
  userRole,
  message,
  isInternal = false,
  newStatus = null
}) => {
  const complaint = await Complaint.findById(complaintId);
  if (!complaint) {
    throw new AppError('Complaint not found.', 404, 'NOT_FOUND');
  }

  complaint.responses.push({
    by: userId,
    role: userRole,
    message,
    isInternal,
    createdAt: new Date()
  });

  if (newStatus && Object.values(COMPLAINT_STATUS).includes(newStatus)) {
    complaint.status = newStatus;
    if (newStatus === COMPLAINT_STATUS.RESOLVED || newStatus === COMPLAINT_STATUS.CLOSED) {
      complaint.resolvedAt = new Date();
    }
  }

  await complaint.save();

  // Notify student if message is public
  if (!isInternal) {
    await createNotification({
      recipient: complaint.complainant,
      type: 'complaint_response',
      title: `Update on Grievance #${complaint.complaintId}`,
      message: `${userRole.replace('_', ' ').toUpperCase()} replied: "${message.substring(0, 60)}..."`,
      actionUrl: `/student/complaints/${complaint._id}`
    });
  }

  return complaint;
};

/**
 * Reopen an unresolved complaint (Student action)
 */
export const reopenComplaint = async (complaintId, studentId, reopenReason) => {
  const complaint = await Complaint.findOne({ _id: complaintId, complainant: studentId });
  if (!complaint) {
    throw new AppError('Complaint not found or unauthorized.', 404, 'NOT_FOUND');
  }

  if (complaint.status !== COMPLAINT_STATUS.RESOLVED && complaint.status !== COMPLAINT_STATUS.CLOSED) {
    throw new AppError('Only resolved or closed complaints can be reopened.', 400, 'CANNOT_REOPEN');
  }

  complaint.status = COMPLAINT_STATUS.IN_PROGRESS;
  complaint.responses.push({
    by: studentId,
    role: ROLES.STUDENT,
    message: `[REOPENED BY STUDENT] ${reopenReason || 'Issue was not adequately resolved.'}`,
    isInternal: false,
    createdAt: new Date()
  });

  await complaint.save();

  emitToRoom(`mess:${complaint.mess.toString()}`, 'complaint:reopened', {
    complaintId: complaint.complaintId,
    subject: complaint.subject
  });

  return complaint;
};


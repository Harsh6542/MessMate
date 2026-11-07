export const ROLES = {
  STUDENT: 'student',
  MESS_STAFF: 'mess_staff',
  MESS_MANAGER: 'mess_manager',
  ADMIN: 'admin'
};

export const ROLE_HIERARCHY = {
  [ROLES.STUDENT]: 1,
  [ROLES.MESS_STAFF]: 2,
  [ROLES.MESS_MANAGER]: 3,
  [ROLES.ADMIN]: 4
};

export const MEAL_TYPES = {
  BREAKFAST: 'breakfast',
  LUNCH: 'lunch',
  DINNER: 'dinner'
};

export const MEAL_SESSION_STATUS = {
  UPCOMING: 'upcoming',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const DECLARATION_STATUS = {
  DECLARED: 'declared',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
  ADMIN_OVERRIDE: 'admin_override'
};

export const COUPON_STATUS = {
  ACTIVE: 'active',
  REDEEMED: 'redeemed',
  EXPIRED: 'expired',
  INVALIDATED: 'invalidated'
};

export const COMPLAINT_CATEGORIES = {
  FOOD_QUALITY: 'food_quality',
  HYGIENE: 'hygiene',
  QUANTITY: 'quantity',
  UNDERCOOKED_STALE: 'undercooked_stale',
  STAFF_BEHAVIOUR: 'staff_behaviour',
  LONG_QUEUES: 'long_queues',
  DRINKING_WATER: 'drinking_water',
  INFRASTRUCTURE: 'infrastructure',
  OTHER: 'other'
};

export const COMPLAINT_STATUS = {
  SUBMITTED: 'submitted',
  ASSIGNED: 'assigned',
  UNDER_REVIEW: 'under_review',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  ESCALATED: 'escalated',
  CLOSED: 'closed'
};

export const COMPLAINT_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

export const BILLING_POLICIES = {
  FIXED_MONTHLY: 'fixed_monthly',
  PER_MEAL: 'per_meal'
};


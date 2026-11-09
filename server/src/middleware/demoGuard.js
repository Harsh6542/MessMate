import { AppError } from '../utils/AppError.js';
import { PROTECTED_EMAILS } from '../utils/cleanupDummyUsers.js';

/**
 * Checks if a user object or incoming request is associated with a demonstration persona / demo account.
 * Demo accounts are strictly quarantined from modifying, creating, or deleting real production data.
 */
export const isDemoUser = (user, req = null) => {
  if (!user) return false;

  // 1. Explicit database boolean flag
  if (user.isDemo === true) return true;

  // 2. Client header flag
  if (req?.headers?.['x-demo-mode'] === 'true') return true;

  // 3. Known official demo emails
  const email = (user.email || '').toLowerCase().trim();
  if (PROTECTED_EMAILS.map((e) => e.toLowerCase()).includes(email)) return true;
  if (email.endsWith('@messmate.edu')) return true;

  // 4. Known demo staff IDs
  const staffId = (user.staffId || '').toUpperCase().trim();
  const demoStaffIds = [
    'STF-101', 'STF-102', 'STF-103', 'STF-104', 'STF-105',
    'MGR-101', 'MGR-102', 'MGR-103', 'MGR-104'
  ];
  if (demoStaffIds.includes(staffId)) return true;

  // 5. Known demo student roll numbers (Ayush Singh & Priya Kumari)
  const roll = (user.rollNumber || '').trim();
  if (['2201003', '2201010'].includes(roll)) return true;

  return false;
};

/**
 * Express middleware to prevent demo accounts from executing sensitive mutations.
 * If the current caller is in demo mode, returns 403 Forbidden with a clear security notice.
 */
export const restrictInDemoMode = (actionName = 'This operation') => {
  return (req, res, next) => {
    if (isDemoUser(req.user, req)) {
      return next(
        new AppError(
          `Demo Mode Security: ${actionName} is strictly disabled while using a demo account to protect your real database and prevent accidental changes.`,
          403,
          'DEMO_ACTION_RESTRICTED'
        )
      );
    }
    next();
  };
};


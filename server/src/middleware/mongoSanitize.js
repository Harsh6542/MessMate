/**
 * Recursive sanitizer to strip MongoDB query operators ($gt, $ne, $where, etc.)
 * and keys containing dots (.) from user inputs to prevent NoSQL injection attacks.
 */
const sanitizeObject = (target) => {
  if (!target || typeof target !== 'object') return target;

  if (Array.isArray(target)) {
    return target.map((item) => sanitizeObject(item));
  }

  const clean = {};
  for (const [key, value] of Object.entries(target)) {
    // Strip keys starting with $ or containing a dot
    if (key.startsWith('$') || key.includes('.')) {
      continue;
    }
    clean[key] = typeof value === 'object' && value !== null ? sanitizeObject(value) : value;
  }
  return clean;
};

export const mongoSanitize = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  next();
};

export default mongoSanitize;


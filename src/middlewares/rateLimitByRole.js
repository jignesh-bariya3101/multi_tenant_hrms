const rateLimit = require('express-rate-limit');
const rateLimits = require('../config/rateLimits');

/**
 * Rate limiting per role.
 * Example:
 * - org_employee: stricter
 * - org_manager/org_admin: more generous
 */
function rateLimitByRole() {
    const employeeLimiter = rateLimit({ windowMs: 60 * 1000, max: rateLimits.org_employee, standardHeaders: true, legacyHeaders: false });
  const managerLimiter = rateLimit({ windowMs: 60 * 1000, max: rateLimits.org_manager, standardHeaders: true, legacyHeaders: false });
  const adminLimiter = rateLimit({ windowMs: 60 * 1000, max: rateLimits.org_admin, standardHeaders: true, legacyHeaders: false });


  return (req, res, next) => {
    const key = req.user?.roleKey;
    if (key === 'org_employee') return employeeLimiter(req, res, next);
    if (key === 'org_manager') return managerLimiter(req, res, next);
    if (key === 'org_admin') return adminLimiter(req, res, next);
    return next();
  };
}

module.exports = { rateLimitByRole };

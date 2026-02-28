const { HttpError } = require('../utils/httpError');

/**
 * Enforce tenant isolation at middleware level.
 * - For org-scoped users, orgId MUST exist and will be used for all DB queries.
 * - For platform-scoped users, orgId may be null (platform operations).
 *
 */
function requireOrgContext(req, res, next) {
  if (!req.user) return next(new HttpError(500, 'Auth middleware must run before tenant isolation'));

  if (req.user.roleScope === 'org') {
    if (!req.user.orgId) return next(new HttpError(403, 'Organization context missing for this user'));
  }

  return next();
}

module.exports = { requireOrgContext };

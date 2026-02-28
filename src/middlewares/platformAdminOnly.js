const { HttpError } = require('../utils/httpError');

/**
 * Allow only platform-scoped superadmin users.
 * (You can extend this later for superadmin_team with specific permissions.)
 */
function platformSuperAdminOnly(req, res, next) {
  if (!req.user) return next(new HttpError(401, 'Unauthorized'));

  if (req.user.roleScope !== 'platform') {
    return next(new HttpError(403, 'Only platform users can access this endpoint'));
  }

  if (req.user.roleKey !== 'superadmin') {
    return next(new HttpError(403, 'Only superadmin can access this endpoint'));
  }

  return next();
}

module.exports = { platformSuperAdminOnly };

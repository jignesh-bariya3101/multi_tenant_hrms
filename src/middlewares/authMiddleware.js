const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { HttpError } = require('../utils/httpError');

/**
 * JWT auth middleware.
 * Resolves: user, org, role.
 * Adds: req.user = { id, email, roleKey, scope, orgId, platformId }
 */
async function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) return next(new HttpError(401, 'Missing Authorization Token'));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      include: { role: true },
    });

    if (!user || !user.isActive) return next(new HttpError(401, 'Invalid or inactive user'));

    req.user = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      roleKey: user.role.key,
      roleScope: user.role.scope, // "platform" | "org"
      orgId: user.orgId,
      platformId: user.platformId,
    };

    return next();
  } catch (e) {
    return next(new HttpError(401, 'Invalid token'));
  }
}

module.exports = { authMiddleware };

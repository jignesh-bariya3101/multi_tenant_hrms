const router = require('express').Router();
const prisma = require('../../config/prisma');
const { asyncHandler } = require('../../utils/asyncHandler');
const { authMiddleware } = require('../../middlewares/authMiddleware');
const { requireOrgContext } = require('../../middlewares/tenantIsolation');
const { checkAccess } = require('../../middlewares/rbacMiddleware');
const { rateLimitByRole } = require('../../middlewares/rateLimitByRole');
const { HttpError } = require('../../utils/httpError');

/**
 * @openapi
 * /api/audit:
 *   get:
 *     summary: View recent audit logs for your organization (org_admin only)
 *     tags: [Audit]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: moduleKey
 *         schema: { type: string, example: "attendance" }
 *       - in: query
 *         name: action
 *         schema: { type: string, example: "read" }
 *       - in: query
 *         name: limit
 *         schema: { type: number, example: 20 }
 *     responses:
 *       200: { description: OK }
 */
router.get(
  '/',
  authMiddleware,
  requireOrgContext,
  rateLimitByRole(),
  checkAccess('reports', 'read'), // reuse reports read; admins already have it (keeps demo simple)
  asyncHandler(async (req, res) => {
    if (req.user.roleKey !== 'org_admin') throw new HttpError(403, 'Only org_admin can view audit logs');

    const { moduleKey, action, limit = 30 } = req.query;

    const where = { platformId: req.user.platformId, orgId: req.user.orgId };
    if (moduleKey) where.moduleKey = moduleKey;
    if (action) where.action = action;

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(Number(limit) || 30, 100),
      select: {
        id: true,
        createdAt: true,
        userId: true,
        roleKey: true,
        moduleKey: true,
        action: true,
        method: true,
        path: true,
        statusCode: true,
        ip: true,
        durationMs: true,
      },
    });

    res.json({ success: true, data: logs });
  })
);

module.exports = router;

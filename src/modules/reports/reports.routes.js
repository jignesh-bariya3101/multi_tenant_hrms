const router = require('express').Router();
const { asyncHandler } = require('../../utils/asyncHandler');
const { authMiddleware } = require('../../middlewares/authMiddleware');
const { requireOrgContext } = require('../../middlewares/tenantIsolation');
const { checkAccess } = require('../../middlewares/rbacMiddleware');
const { rateLimitByRole } = require('../../middlewares/rateLimitByRole');
const { getReports } = require('./reports.controller');

/**
 * @openapi
 * /api/reports:
 *   get:
 *     summary: Get reports (RBAC protected)
 *     tags: [Reports]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 */
router.get(
  '/',
  authMiddleware,
  requireOrgContext,
  rateLimitByRole(),
  checkAccess('reports', 'read'),
  asyncHandler(getReports)
);

module.exports = router;

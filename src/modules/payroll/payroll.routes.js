const router = require('express').Router();
const { asyncHandler } = require('../../utils/asyncHandler');
const { authMiddleware } = require('../../middlewares/authMiddleware');
const { requireOrgContext } = require('../../middlewares/tenantIsolation');
const { checkAccess } = require('../../middlewares/rbacMiddleware');
const { rateLimitByRole } = require('../../middlewares/rateLimitByRole');
const { HttpError } = require('../../utils/httpError');
const { runPayrollSchema } = require('./payroll.validation');
const { runPayroll } = require('./payroll.controller');

/**
 * @openapi
 * /api/payroll/run:
 *   post:
 *     summary: Run payroll (RBAC protected)
 *     tags: [Payroll]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [month]
 *             properties:
 *               month: { type: string, example: "2026-02" }
 *     responses:
 *       201: { description: Created }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 */
router.post(
  '/run',
  authMiddleware,
  requireOrgContext,
  rateLimitByRole(),
  checkAccess('payroll', 'write'),
  asyncHandler(async (req, res) => {
    const parsed = runPayrollSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, 'Validation failed', parsed.error.flatten());
    return runPayroll(req, res);
  })
);

module.exports = router;

const router = require('express').Router();
const { asyncHandler } = require('../../utils/asyncHandler');
const { authMiddleware } = require('../../middlewares/authMiddleware');
const { requireOrgContext } = require('../../middlewares/tenantIsolation');
const { checkAccess } = require('../../middlewares/rbacMiddleware');
const { rateLimitByRole } = require('../../middlewares/rateLimitByRole');
const { HttpError } = require('../../utils/httpError');

const {
  createEmployeeSchema
} = require('./employee.validation');

const {
  listEmployees,
  createEmployee
} = require('./employee.controller');

/**
 * @openapi
 * /api/employee:
 *   get:
 *     summary: List employees in organization
 *     tags: [Employee]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     summary: Create employee (org_admin only)
 *     tags: [Employee]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, email, password]
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               roleKey:
 *                 type: string
 *                 enum: [org_employee, org_manager, org_admin]
 *     responses:
 *       201:
 *         description: Created
 */

router.get(
  '/',
  authMiddleware,
  requireOrgContext,
  rateLimitByRole(),
  checkAccess('employee_management', 'read'),
  asyncHandler(listEmployees)
);

router.post(
  '/',
  authMiddleware,
  requireOrgContext,
  rateLimitByRole(),
  checkAccess('employee_management', 'write'),
  asyncHandler(async (req, res) => {
    const parsed = createEmployeeSchema.safeParse(req.body);
    if (!parsed.success)
      throw new HttpError(400, 'Validation failed', parsed.error.flatten());

    return createEmployee(req, res);
  })
);

module.exports = router;
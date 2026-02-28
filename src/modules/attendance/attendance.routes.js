const router = require('express').Router();
const { asyncHandler } = require('../../utils/asyncHandler');
const { authMiddleware } = require('../../middlewares/authMiddleware');
const { requireOrgContext } = require('../../middlewares/tenantIsolation');
const { checkAccess } = require('../../middlewares/rbacMiddleware');
const { rateLimitByRole } = require('../../middlewares/rateLimitByRole');
const { HttpError } = require('../../utils/httpError');
const { createAttendanceSchema } = require('./attendance.validation');
const { listAttendance, createAttendance } = require('./attendance.controller');

/**
 * @openapi
 * /api/attendance:
 *   get:
 *     summary: List attendance records
 *     tags: [Attendance]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           example: "2026-02-28"
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     summary: Create attendance record
 *     tags: [Attendance]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, date, status]
 *             properties:
 *               userId:
 *                 type: string
 *               date:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [present, absent, leave]
 *     responses:
 *       201:
 *         description: Created
 */

router.get(
  '/',
  authMiddleware,
  requireOrgContext,
  rateLimitByRole(),
  checkAccess('attendance', 'read'),
  asyncHandler(listAttendance)
);

router.post(
  '/',
  authMiddleware,
  requireOrgContext,
  rateLimitByRole(),
  checkAccess('attendance', 'write'),
  asyncHandler(async (req, res) => {
    const parsed = createAttendanceSchema.safeParse(req.body);
    if (!parsed.success)
      throw new HttpError(400, 'Validation failed', parsed.error.flatten());

    return createAttendance(req, res);
  })
);

module.exports = router;
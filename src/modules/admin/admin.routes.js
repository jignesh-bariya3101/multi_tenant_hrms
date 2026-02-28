const router = require('express').Router();
const { asyncHandler } = require('../../utils/asyncHandler');
const { authMiddleware } = require('../../middlewares/authMiddleware');
const { requireOrgContext } = require('../../middlewares/tenantIsolation');
const { HttpError } = require('../../utils/httpError');
const { updateUserOverridesSchema } = require('./admin.validation');
const { updateUserModuleOverrides } = require('./admin.controller');

/**
 * @openapi
 * /api/admin/users/{userId}/module-overrides:
 *   put:
 *     summary: Org admin updates module overrides for a user (per-employee override)
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [overrides]
 *             properties:
 *               overrides:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [moduleKey]
 *                   properties:
 *                     moduleKey: { type: string, example: reports }
 *                     read: { type: boolean, example: true }
 *                     write: { type: boolean, example: false }
 *                     update: { type: boolean, example: false }
 *                     delete: { type: boolean, example: false }
 *     responses:
 *       200: { description: OK }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 */
router.put(
  '/users/:userId/module-overrides',
  authMiddleware,
  requireOrgContext,
  asyncHandler(async (req, res) => {
    const parsed = updateUserOverridesSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, 'Validation failed', parsed.error.flatten());
    return updateUserModuleOverrides(req, res);
  })
);

module.exports = router;

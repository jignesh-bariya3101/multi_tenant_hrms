const router = require('express').Router();
const { asyncHandler } = require('../../utils/asyncHandler');
const { HttpError } = require('../../utils/httpError');

const { authMiddleware } = require('../../middlewares/authMiddleware');
const { platformSuperAdminOnly } = require('../../middlewares/platformAdminOnly');

const { createOrgSchema } = require('./platform.validation');
const { listOrganizations, createOrganizationWithAdmin } = require('./platform.controller');

/**
 * @openapi
 * /api/platform/orgs:
 *   get:
 *     summary: List organizations in current platform (superadmin only)
 *     tags: [Platform]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 */
router.get('/orgs', authMiddleware, platformSuperAdminOnly, asyncHandler(listOrganizations));

/**
 * @openapi
 * /api/platform/orgs:
 *   post:
 *     summary: Create organization and org admin user (superadmin only)
 *     tags: [Platform]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orgName, adminFullName, adminEmail, adminPassword]
 *             properties:
 *               orgName: { type: string, example: "Org C" }
 *               adminFullName: { type: string, example: "Org Admin C" }
 *               adminEmail: { type: string, example: "orgadminC@demo.com" }
 *               adminPassword: { type: string, example: "Password@123" }
 *     responses:
 *       201: { description: Created }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 */
router.post('/orgs', authMiddleware, platformSuperAdminOnly, asyncHandler(async (req, res) => {
  const parsed = createOrgSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, 'Validation failed', parsed.error.flatten());
  return createOrganizationWithAdmin(req, res);
}));

module.exports = router;

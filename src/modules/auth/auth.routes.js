const router = require('express').Router();
const { asyncHandler } = require('../../utils/asyncHandler');
const { loginSchema } = require('./auth.validation');
const { login } = require('./auth.controller');
const { me } = require('./me.controller');
const { authMiddleware } = require('../../middlewares/authMiddleware');
const { HttpError } = require('../../utils/httpError');

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Login and get JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: orgadminA@demo.com }
 *               password: { type: string, example: Password@123 }
 *     responses:
 *       200:
 *         description: JWT token
 */
router.post('/login', asyncHandler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, 'Validation failed', parsed.error.flatten());
  return login(req, res);
}));



/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Get current logged-in user info + resolved permissions
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 *       401: { description: Unauthorized }
 */
router.get('/me', authMiddleware, asyncHandler(me));

module.exports = router;

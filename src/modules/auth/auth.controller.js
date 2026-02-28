const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../../config/prisma');
const env = require('../../config/env');
const { HttpError } = require('../../utils/httpError');
const { ok } = require('../../utils/response');

async function login(req, res) {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true, organization: true, platform: true },
  });

  if (!user) throw new HttpError(401, 'Invalid email or password');

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new HttpError(401, 'Invalid email or password');

  const token = jwt.sign(
    {
      sub: user.id,
      roleKey: user.role.key,
      scope: user.role.scope,
      orgId: user.orgId || null,
      platformId: user.platformId,
    },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn }
  );

  return ok(res, {
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      roleKey: user.role.key,
      roleScope: user.role.scope,
      orgId: user.orgId,
      platformId: user.platformId,
      orgName: user.organization?.name || null,
      platformName: user.platform?.name || null,
    },
  }, 'Login successful');
}

module.exports = { login };

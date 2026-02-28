const prisma = require('../../config/prisma');
const { ok } = require('../../utils/response');
const { resolvePermissions } = require('../../middlewares/rbacMiddleware');
const { HttpError } = require('../../utils/httpError');

async function me(req, res) {
  if (!req.user) throw new HttpError(401, 'Unauthorized');

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { role: true, organization: true, platform: true },
  });

  const sampleModules = ['attendance', 'payroll', 'reports', 'employee_management'];
  const perms = {};

  for (const moduleKey of sampleModules) {
    perms[moduleKey] = await resolvePermissions({
      userId: user.id,
      roleId: user.roleId,
      moduleKey,
    });
  }

  return ok(res, {
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      roleKey: user.role.key,
      roleScope: user.role.scope,
      orgId: user.orgId,
      orgName: user.organization?.name || null,
      platformId: user.platformId,
      platformName: user.platform?.name || null,
    },
    resolvedPermissions: perms,
  }, 'Current session');
}

module.exports = { me };

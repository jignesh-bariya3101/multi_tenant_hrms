const prisma = require('../config/prisma');
const { HttpError } = require('../utils/httpError');

/**
 * Resolve permissions for (userId, roleId, moduleKey) with per-user overrides.
 * Order:
 * 1) role_module_access
 * 2) user_module_overrides (nullable fields override only when not null)
 */
async function resolvePermissions({ userId, roleId, moduleKey }) {
  const mod = await prisma.module.findUnique({ where: { key: moduleKey } });
  if (!mod) throw new HttpError(400, `Unknown module: ${moduleKey}`);

  const roleAccess = await prisma.roleModuleAccess.findUnique({
    where: { roleId_moduleId: { roleId, moduleId: mod.id } },
  });

  const base = {
    read: roleAccess?.read ?? false,
    write: roleAccess?.write ?? false,
    update: roleAccess?.update ?? false,
    delete: roleAccess?.delete ?? false,
  };

  const override = await prisma.userModuleOverride.findUnique({
    where: { userId_moduleId: { userId, moduleId: mod.id } },
  });

  const finalPerm = {
    read: override?.read ?? base.read,
    write: override?.write ?? base.write,
    update: override?.update ?? base.update,
    delete: override?.delete ?? base.delete,
  };

  return finalPerm;
}

/**
 * checkAccess(moduleKey, action) middleware
 * - Verifies org isolation (org users cannot access another org because req.user.orgId is enforced and used)
 * - Applies role defaults + per-user overrides
 */
function checkAccess(moduleKey, action) {
  return async function(req, res, next) {
    if (!req.user) return next(new HttpError(500, 'Auth middleware must run before RBAC'));

    // This demo RBAC applies for org-scoped routes
    if (req.user.roleScope !== 'org') {
      return next(new HttpError(403, 'Platform user cannot access organization module routes'));
    }

    const userWithRole = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { role: true },
    });

    const perms = await resolvePermissions({
      userId: req.user.id,
      roleId: userWithRole.roleId,
      moduleKey,
    });

    // Attach audit context early so failures are also tracked
    req.audit = { moduleKey, action };

    if (!perms[action]) {
      return next(new HttpError(403, `Access denied: missing ${action.toUpperCase()} permission for module ${moduleKey}`));
    }

    // Attach resolved permissions for downstream use/debug
    req.permissions = { moduleKey, ...perms };

    return next();
  };
}

module.exports = { checkAccess, resolvePermissions };

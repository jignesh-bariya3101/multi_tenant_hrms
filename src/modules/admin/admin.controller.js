const prisma = require('../../config/prisma');
const { HttpError } = require('../../utils/httpError');
const { ok } = require('../../utils/response');

/**
 * Org admin can update module overrides for a user in their org only.
 * - This is NOT global role change; only per-user overrides.
 */
async function updateUserModuleOverrides(req, res) {
  const requester = req.user;

  if (requester.roleKey !== 'org_admin') {
    throw new HttpError(403, 'Only org_admin can update employee overrides');
  }

  const { userId } = req.params;

  // Tenant isolation: target user must belong to requester's org
  const targetUser = await prisma.user.findFirst({
    where: { id: userId, orgId: requester.orgId },
    include: { role: true },
  });
  if (!targetUser) throw new HttpError(404, 'Target user not found in your organization');

  // Apply overrides (Create / Update)
  const results = [];
  for (const ov of req.body.overrides) {
    const mod = await prisma.module.findUnique({ where: { key: ov.moduleKey } });
    if (!mod) throw new HttpError(400, `Unknown moduleKey: ${ov.moduleKey}`);

    const createOrUpdate = await prisma.userModuleOverride.upsert({
      where: { userId_moduleId: { userId: targetUser.id, moduleId: mod.id } },
      update: {
        read: ov.read !== undefined ? ov.read : undefined,
        write: ov.write !== undefined ? ov.write : undefined,
        update: ov.update !== undefined ? ov.update : undefined,
        delete: ov.delete !== undefined ? ov.delete : undefined,
      },
      create: {
        userId: targetUser.id,
        moduleId: mod.id,
        read: ov.read,
        write: ov.write,
        update: ov.update,
        delete: ov.delete,
      },
    });

    results.push({ moduleKey: ov.moduleKey, override: createOrUpdate });
  }

  return ok(res, { userId: targetUser.id, overrides: results }, 'Overrides updated');
}

module.exports = { updateUserModuleOverrides };

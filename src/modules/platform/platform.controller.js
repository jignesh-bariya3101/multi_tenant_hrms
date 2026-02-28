const prisma = require('../../config/prisma');
const bcrypt = require('bcryptjs');
const { ok, created } = require('../../utils/response');
const { HttpError } = require('../../utils/httpError');

/**
 * List organizations for the current platform.
 */
async function listOrganizations(req, res) {
  const orgs = await prisma.organization.findMany({
    where: { platformId: req.user.platformId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, platformId: true, createdAt: true },
  });

  return ok(res, orgs, 'Organizations fetched');
}

/**
 * Platform onboarding:
 * Creates an organization and an org_admin user inside it.
 * Only platform superadmin can call this.
 */
async function createOrganizationWithAdmin(req, res) {
  const { orgName, adminFullName, adminEmail, adminPassword } = req.body;

  // Ensure org_admin role exists
  const orgAdminRole = await prisma.role.findUnique({ where: { key: 'org_admin' } });
  if (!orgAdminRole) throw new HttpError(500, 'org_admin role not found');

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  // Transaction: org + admin user
  const result = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: {
        platformId: req.user.platformId,
        name: orgName,
      },
    });

    const adminUser = await tx.user.create({
      data: {
        platformId: req.user.platformId,
        orgId: org.id,
        roleId: orgAdminRole.id,
        fullName: adminFullName,
        email: adminEmail,
        password: passwordHash,
      },
      select: { id: true, fullName: true, email: true, orgId: true },
    });

    return { org, adminUser };
  });

  return created(res, result, 'Organization and org admin created');
}

module.exports = { listOrganizations, createOrganizationWithAdmin };

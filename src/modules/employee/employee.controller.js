const prisma = require('../../config/prisma');
const bcrypt = require('bcryptjs');
const { ok, created } = require('../../utils/response');
const { HttpError } = require('../../utils/httpError');

async function listEmployees(req, res) {
  const users = await prisma.user.findMany({
    where: { orgId: req.user.orgId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, fullName: true, email: true, isActive: true, orgId: true },
  });

  return ok(res, users, 'Employees fetched');
}

async function createEmployee(req, res) {
  if (req.user.roleKey !== 'org_admin') throw new HttpError(403, 'Only org_admin can create employees');

  const { fullName, email, password, roleKey } = req.body;

  const role = await prisma.role.findUnique({ where: { key: roleKey || 'org_employee' } });
  if (!role || role.scope !== 'org') throw new HttpError(400, 'Invalid roleKey for org user');

  const passwordHash = await bcrypt.hash(password, 10);

  const createdUser = await prisma.user.create({
    data: {
      platformId: req.user.platformId,
      orgId: req.user.orgId,
      roleId: role.id,
      fullName,
      email,
      password: passwordHash,
    },
    select: { id: true, fullName: true, email: true, orgId: true },
  });

  return created(res, createdUser, 'Employee created');
}

module.exports = { listEmployees, createEmployee };

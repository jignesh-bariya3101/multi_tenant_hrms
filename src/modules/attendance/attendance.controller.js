const prisma = require('../../config/prisma');
const { ok, created } = require('../../utils/response');
const { HttpError } = require('../../utils/httpError');

async function listAttendance(req, res) {
  const { date } = req.query;

  const where = { orgId: req.user.orgId };
  if (date) where.date = new Date(date);

  const records = await prisma.attendanceRecord.findMany({
    where,
    orderBy: { date: 'desc' },
    take: 50,
    include: { user: { select: { id: true, fullName: true, email: true } } },
  });

  return ok(res, { orgId: req.user.orgId, permissions: req.permissions, records }, 'Attendance fetched');
}

async function createAttendance(req, res) {
  const { userId, date, status } = req.body;

  const target = await prisma.user.findFirst({ where: { id: userId, orgId: req.user.orgId } });
  if (!target) throw new HttpError(404, 'Employee not found in your organization');

  const saved = await prisma.attendanceRecord.upsert({
    where: { orgId_userId_date: { orgId: req.user.orgId, userId, date: new Date(date) } },
    update: { status },
    create: { orgId: req.user.orgId, userId, date: new Date(date), status },
  });

  return created(res, saved, 'Attendance saved');
}

module.exports = { listAttendance, createAttendance };

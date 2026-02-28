/**
 * Seed script:
 * - 1 platform
 * - platform users: superadmin + superadmin_team
 * - 2 orgs
 * - each org: org_admin, org_manager, 3 org_employees with different overrides
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = 'Password@123';

const MODULES = [
  { key: 'employee_management', name: 'Employee Management' },
  { key: 'payroll', name: 'Payroll' },
  { key: 'attendance', name: 'Attendance' },
  { key: 'leave_management', name: 'Leave Management' },
  { key: 'recruitment', name: 'Recruitment' },
  { key: 'performance', name: 'Performance' },
  { key: 'reports', name: 'Reports' },
  { key: 'settings', name: 'Settings' },
];

async function upsertRole(key, scope, name, description) {
  return prisma.role.upsert({
    where: { key },
    update: { scope, name, description },
    create: { key, scope, name, description },
  });
}

async function main() {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  // Platform
  const platform = await prisma.platform.create({
    data: { name: 'HRMS Demo Platform' },
  });

  // Roles
  const superadminRole = await upsertRole('superadmin', 'platform', 'Super Admin', 'Full platform control');
  const superadminTeamRole = await upsertRole('superadmin_team', 'platform', 'Super Admin Team', 'Limited platform operations');

  const orgAdminRole = await upsertRole('org_admin', 'org', 'Org Admin', 'Full org control');
  const orgManagerRole = await upsertRole('org_manager', 'org', 'Org Manager', 'Manages teams/departments');
  const orgEmployeeRole = await upsertRole('org_employee', 'org', 'Org Employee', 'Basic employee access');

  // Modules
  for (const m of MODULES) {
    await prisma.module.upsert({
      where: { key: m.key },
      update: { name: m.name },
      create: { key: m.key, name: m.name },
    });
  }
  const modules = await prisma.module.findMany();

  // Role defaults (simple baseline)
  // org_admin: full access to all modules
  for (const mod of modules) {
    await prisma.roleModuleAccess.upsert({
      where: { roleId_moduleId: { roleId: orgAdminRole.id, moduleId: mod.id } },
      update: { read: true, write: true, update: true, delete: true },
      create: { roleId: orgAdminRole.id, moduleId: mod.id, read: true, write: true, update: true, delete: true },
    });
  }

  // org_manager: read all, write/update for attendance/leave/performance/recruitment, no delete
  const managerWritable = new Set(['attendance','leave_management','performance','recruitment','employee_management']);
  for (const mod of modules) {
    await prisma.roleModuleAccess.upsert({
      where: { roleId_moduleId: { roleId: orgManagerRole.id, moduleId: mod.id } },
      update: { read: true, write: managerWritable.has(mod.key), update: managerWritable.has(mod.key), delete: false },
      create: { roleId: orgManagerRole.id, moduleId: mod.id, read: true, write: managerWritable.has(mod.key), update: managerWritable.has(mod.key), delete: false },
    });
  }

  // org_employee: read attendance + leave + employee_management (self), nothing else by default
  const employeeReadable = new Set(['attendance','leave_management','employee_management']);
  for (const mod of modules) {
    await prisma.roleModuleAccess.upsert({
      where: { roleId_moduleId: { roleId: orgEmployeeRole.id, moduleId: mod.id } },
      update: { read: employeeReadable.has(mod.key), write: false, update: false, delete: false },
      create: { roleId: orgEmployeeRole.id, moduleId: mod.id, read: employeeReadable.has(mod.key), write: false, update: false, delete: false },
    });
  }

  // Platform users
  await prisma.user.create({
    data: {
      platformId: platform.id,
      orgId: null,
      roleId: superadminRole.id,
      fullName: 'Super Admin',
      email: 'superadmin@demo.com',
      password: passwordHash,
    },
  });

  await prisma.user.create({
    data: {
      platformId: platform.id,
      orgId: null,
      roleId: superadminTeamRole.id,
      fullName: 'Super Admin Team',
      email: 'superadminteam@demo.com',
      password: passwordHash,
    },
  });

  // Orgs
  const orgA = await prisma.organization.create({ data: { platformId: platform.id, name: 'Org A' } });
  const orgB = await prisma.organization.create({ data: { platformId: platform.id, name: 'Org B' } });

  async function createOrgUsers(org, suffix) {
    const orgAdmin = await prisma.user.create({
      data: {
        platformId: platform.id,
        orgId: org.id,
        roleId: orgAdminRole.id,
        fullName: `Org Admin ${suffix}`,
        email: `orgadmin${suffix}@demo.com`,
        password: passwordHash,
      },
    });

    await prisma.user.create({
      data: {
        platformId: platform.id,
        orgId: org.id,
        roleId: orgManagerRole.id,
        fullName: `Org Manager ${suffix}`,
        email: `orgmanager${suffix}@demo.com`,
        password: passwordHash,
      },
    });

    const emp1 = await prisma.user.create({
      data: {
        platformId: platform.id,
        orgId: org.id,
        roleId: orgEmployeeRole.id,
        fullName: `Org Employee 1 ${suffix}`,
        email: `orgemployee1${suffix}@demo.com`,
        password: passwordHash,
      },
    });

    const emp2 = await prisma.user.create({
      data: {
        platformId: platform.id,
        orgId: org.id,
        roleId: orgEmployeeRole.id,
        fullName: `Org Employee 2 ${suffix}`,
        email: `orgemployee2${suffix}@demo.com`,
        password: passwordHash,
      },
    });

    const emp3 = await prisma.user.create({
      data: {
        platformId: platform.id,
        orgId: org.id,
        roleId: orgEmployeeRole.id,
        fullName: `Org Employee 3 ${suffix}`,
        email: `orgemployee3${suffix}@demo.com`,
        password: passwordHash,
      },
    });

    // Different module overrides per employee
    const reportsModule = modules.find(m => m.key === 'reports');
    const payrollModule = modules.find(m => m.key === 'payroll');

    // emp1: can read reports
    await prisma.userModuleOverride.upsert({
      where: { userId_moduleId: { userId: emp1.id, moduleId: reportsModule.id } },
      update: { read: true, write: false, update: false, delete: false },
      create: { userId: emp1.id, moduleId: reportsModule.id, read: true, write: false, update: false, delete: false },
    });

    // emp2: can write payroll (override)
    await prisma.userModuleOverride.upsert({
      where: { userId_moduleId: { userId: emp2.id, moduleId: payrollModule.id } },
      update: { write: true },
      create: { userId: emp2.id, moduleId: payrollModule.id, write: true },
    });

    // emp3: explicitly deny attendance read (override to false)
    const attendanceModule = modules.find(m => m.key === 'attendance');
    await prisma.userModuleOverride.upsert({
      where: { userId_moduleId: { userId: emp3.id, moduleId: attendanceModule.id } },
      update: { read: false },
      create: { userId: emp3.id, moduleId: attendanceModule.id, read: false },
    });

    return { orgAdmin };
  }

  await createOrgUsers(orgA, 'A');
  await createOrgUsers(orgB, 'B');


// Seed a few attendance records (for testing flows)
const sampleDate1 = new Date('2026-02-01');
const sampleDate2 = new Date('2026-02-02');

const orgAUsers = await prisma.user.findMany({ where: { orgId: orgA.id } });
const orgBUsers = await prisma.user.findMany({ where: { orgId: orgB.id } });

if (orgAUsers.length) {
  await prisma.attendanceRecord.create({ data: { orgId: orgA.id, userId: orgAUsers[0].id, date: sampleDate1, status: 'present' } });
  await prisma.attendanceRecord.create({ data: { orgId: orgA.id, userId: orgAUsers[0].id, date: sampleDate2, status: 'absent' } });
}
if (orgBUsers.length) {
  await prisma.attendanceRecord.create({ data: { orgId: orgB.id, userId: orgBUsers[0].id, date: sampleDate1, status: 'present' } });
}

  console.log('✅ Seed completed.');
  console.log('Default password for all users:', DEFAULT_PASSWORD);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

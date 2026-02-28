const { HttpError } = require('../src/utils/httpError');

// Mock prisma client used inside rbacMiddleware
jest.mock('../src/config/prisma', () => ({
  module: { findUnique: jest.fn() },
  roleModuleAccess: { findUnique: jest.fn() },
  userModuleOverride: { findUnique: jest.fn() },
  user: { findUnique: jest.fn() },
}));

const prisma = require('../src/config/prisma');
const { resolvePermissions, checkAccess } = require('../src/middlewares/rbacMiddleware');

describe('RBAC middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('resolvePermissions throws for unknown module', async () => {
    prisma.module.findUnique.mockResolvedValue(null);

    await expect(resolvePermissions({ userId: 'u1', roleId: 'r1', moduleKey: 'unknown' }))
      .rejects
      .toBeInstanceOf(HttpError);
  });

  test('resolvePermissions merges role defaults + per-user overrides', async () => {
    prisma.module.findUnique.mockResolvedValue({ id: 'm1', key: 'reports' });
    prisma.roleModuleAccess.findUnique.mockResolvedValue({ read: true, write: false, update: false, delete: false });
    prisma.userModuleOverride.findUnique.mockResolvedValue({ read: null, write: true, update: null, delete: null });

    const perms = await resolvePermissions({ userId: 'u1', roleId: 'r1', moduleKey: 'reports' });
    expect(perms).toEqual({ read: true, write: true, update: false, delete: false });
  });

  test('checkAccess denies platform users for org modules', async () => {
    const mw = checkAccess('reports', 'read');

    const req = { user: { id: 'u1', roleScope: 'platform' } };
    const res = {};
    const next = jest.fn();

    await mw(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(HttpError);
    expect(err.statusCode).toBe(403);
  });

  test('checkAccess sets req.permissions and calls next when allowed', async () => {
    // resolvePermissions path
    prisma.module.findUnique.mockResolvedValue({ id: 'm1', key: 'attendance' });
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', roleId: 'r1', role: { key: 'org_admin', scope: 'org' } });
    prisma.roleModuleAccess.findUnique.mockResolvedValue({ read: true, write: true, update: true, delete: false });
    prisma.userModuleOverride.findUnique.mockResolvedValue(null);

    const mw = checkAccess('attendance', 'read');

    const req = { user: { id: 'u1', roleScope: 'org' } };
    const res = {};
    const next = jest.fn();

    await mw(req, res, next);

    expect(req.permissions).toBeTruthy();
    expect(req.permissions.moduleKey).toBe('attendance');
    expect(next).toHaveBeenCalledWith(); // no error
  });
});

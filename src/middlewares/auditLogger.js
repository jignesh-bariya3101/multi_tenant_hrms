const prisma = require('../config/prisma');

/**
 * Lightweight audit logging.
 *
 * What we log:
 * - who: userId + roleKey
 * - where: orgId + platformId
 * - what: moduleKey + action (from RBAC middleware)
 * - request: method + path + ip + userAgent
 * - result: statusCode + durationMs
 *
 * Notes:
 * - We only log when req.audit is present (set by RBAC checkAccess).
 * - We keep it intentionally small to avoid noisy "log everything" systems.
 */
function attachAuditLogger() {
  return function auditLogger(req, res, next) {
    // High precision timer for duration
    const start = process.hrtime.bigint();

    res.on('finish', async () => {
      try {
        if (req._auditLogged) return;
        if (!req.audit) return;
        if (!req.user) return; // no user, skip
        if (!req.user.platformId) return;

        const durationMs = Number((process.hrtime.bigint() - start) / BigInt(1_000_000));

        await prisma.auditLog.create({
          data: {
            platformId: req.user.platformId,
            orgId: req.user.orgId || null,
            userId: req.user.id || null,
            roleKey: req.user.roleKey || null,
            moduleKey: req.audit.moduleKey || null,
            action: req.audit.action || null,
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            ip: req.ip,
            userAgent: req.headers['user-agent'] || null,
            durationMs,
          },
        });

        req._auditLogged = true;
      } catch (_) {
        // don't block response / don't crash the app for audit failures
      }
    });

    return next();
  };
}

/**
 * Used by errorHandler to log audit for failed requests.
 * Prevent double insert by setting req._auditLogged.
 */
async function logAuditForError(req, statusCode) {
  try {
    if (req._auditLogged) return;
    if (!req.audit) return;
    if (!req.user) return;
    if (!req.user.platformId) return;

    await prisma.auditLog.create({
      data: {
        platformId: req.user.platformId,
        orgId: req.user.orgId || null,
        userId: req.user.id || null,
        roleKey: req.user.roleKey || null,
        moduleKey: req.audit.moduleKey || null,
        action: req.audit.action || null,
        method: req.method,
        path: req.originalUrl,
        statusCode,
        ip: req.ip,
        userAgent: req.headers['user-agent'] || null,
        durationMs: null,
      },
    });

    req._auditLogged = true;
  } catch (_) {
    // ignore
  }
}

module.exports = { attachAuditLogger, logAuditForError };

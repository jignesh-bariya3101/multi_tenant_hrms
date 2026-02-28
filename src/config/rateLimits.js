/**
 * Rate limits per role (requests per minute).
 * Tweaked to keep demo usable while still showing role-based controls.
 */
module.exports = {
  org_employee: 60,
  org_manager: 120,
  org_admin: 240,
};

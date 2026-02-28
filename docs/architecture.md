# Architecture Notes (HRMS RBAC Demo)

## Key goals
- Multi-tenant isolation at middleware level
- Reusable RBAC middleware: `checkAccess(moduleKey, action)`
- Clean folder structure (microservices-ready)
- Swagger for API docs

## Tenant isolation
- Org-scoped users have `orgId` attached to token and `req.user`.
- DB operations on org resources ALWAYS use `where: { orgId: req.user.orgId }`.
- This prevents Org A users from touching Org B resources.

## RBAC
Tables:
- `roles`, `modules`, `role_module_access`
- `user_module_overrides`

Resolution:
- Start from role defaults in `role_module_access`
- Apply per-user overrides where fields are not null

## Suggested next production steps (when extending)
- Add AuditLog table to track access
- Add refresh tokens + token rotation
- Add unit tests for RBAC and tenant isolation
- Add role-based rate limit values per endpoint category

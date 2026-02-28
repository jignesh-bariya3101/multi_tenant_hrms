# HRMS SaaS RBAC Demo

### Permission resolution order

1. **Tenant isolation**: request user is authenticated and has an `orgId` (unless superadmin use-cases are added later).
2. **Role defaults**: `role_module_access` provides base permissions per role per module.
3. **Per-user overrides**: `user_module_overrides` can override role defaults for a specific user.
4. Final permission is computed per `{module, action}`.

## Folder structure

```
/src
  /config
  /middlewares
  /modules
    /auth
    /attendance
    /payroll
    /reports
    /employee
  /utils
  app.js
  server.js
/prisma
  schema.prisma
  seed.js
/test
 rbacMiddleware.test.js
```

## Tech decisions
- **Zod** for request validation
- **Swagger** (swagger-jsdoc + swagger-ui-express) for API docs
- **Prisma** as ORM + migrations
- **Helmet/CORS/Morgan** for common production middleware
- **Rate limiting** by role (basic example included)

## Setups

### 1) Install dependencies
npm install

### 2) Create PostgreSQL database
Create a local DB named `hrms_rbac_demo` (or change DATABASE_URL).

Example:
createdb hrms_rbac_demo

### 3) Configure environment
cp .env.example to .env

### 4) Prisma migrate + generate
npm run prisma:migrate
npm run prisma:generate

### 5) Seed data
npm run db:seed

### 6) Run server
npm run dev
# or: npm start

## End-user testing flows (Swagger)

After starting the server, open Swagger at `/api/docs`.

1) Login using `/api/auth/login` and copy `data.token`.
2) Click **Authorize** and paste `Bearer <token>`.
3) Use **/api/auth/me** to confirm who you are logged in as and view resolved permissions.
4) Follow scenarios in `docs/testing-guide.md`.

## Swagger
Open:
- `http://localhost:3000/api/docs`

## Demo users (created by seed)
Seed creates:
- 1 platform
- 2 organizations (Org A, Org B)
- For each org: 1 org_admin, 1 org_manager, 3 org_employees (with different overrides)

Credentials (default password for all): `Password@123`

You can login to get a JWT token using:
- `POST /api/auth/login`

## Protected routes (required)
- `GET  /api/attendance` → `checkAccess('attendance', 'read')`
- `POST /api/payroll/run` → `checkAccess('payroll', 'write')`
- `GET  /api/reports` → `checkAccess('reports', 'read')`
- `PUT  /api/employee/:id` → `checkAccess('employee_management', 'update')`

## Admin permission override API (required)
- `PUT /api/admin/users/:userId/module-overrides`
  - Only `org_admin` can update overrides **within their own org**

## Sample cURL

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"orgadminA@demo.com","password":"Password@123"}'
```

### Access attendance (read)
```bash
curl http://localhost:3000/api/attendance \
  -H "Authorization: Bearer <TOKEN>"
```

### Update employee module overrides (org_admin only)
```bash
curl -X PUT http://localhost:3000/api/admin/users/<USER_ID>/module-overrides \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "overrides": [
      { "moduleKey": "reports", "read": true, "write": false, "update": false, "delete": false }
    ]
  }'
```

## Unit tests (RBAC)
Run:
```bash
npm test
```

These tests mock Prisma and validate:
- unknown module handling
- role defaults + user override merge
- platform user blocked from org routes
- allowed request sets req.permissions

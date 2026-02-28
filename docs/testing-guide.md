# Testing Guide (Non-developer friendly)

Open Swagger:
- http://localhost:3000/api/docs

## Step 0: Login and Authorize
1. Call **POST /api/auth/login**
2. Copy `data.token`
3. Click **Authorize** (top-right) and paste:
   `Bearer <TOKEN>`

Then call:
- **GET /api/auth/me**
This confirms logged-in user + role + org + example resolved permissions.

---

## Scenario 0: Create new Organization (Tenant onboarding)
1. Login as platform superadmin:
   - email: `superadmin@demo.com`
   - password: `Password@123`
2. Create org + org admin:
   - **POST /api/platform/orgs**
   Body:
   ```json
   {
     "orgName": "Org C",
     "adminFullName": "Org Admin C",
     "adminEmail": "orgadminC@demo.com",
     "adminPassword": "Password@123"
   }
   ```
3. Login as the new org admin and continue with org scenarios.

---

## Scenario 1: Org Admin creates an employee and sets module access
1. Login as org admin:
   - email: `orgadminA@demo.com`
   - password: `Password@123`

2. Create employee (same org):
   - **POST /api/employee**
   Body:
   ```json
   {
     "fullName": "New Employee A",
     "email": "newemployeeA@demo.com",
     "password": "Password@123"
   }
   ```

3. Verify employee exists:
   - **GET /api/employee**
   Find new employee and copy `id`.

4. Give employee access to Reports (read):
   - **PUT /api/admin/users/{userId}/module-overrides**
   Body:
   ```json
   {
     "overrides": [
       { "moduleKey": "reports", "read": true }
     ]
   }
   ```

5. Login as new employee and test:
   - **GET /api/reports**
   Expected: ✅ 200

---

## Scenario 2: Attendance entry flow (Manager/Admin can create)
1. Login as org manager:
   - email: `orgmanagerA@demo.com`
   - password: `Password@123`

2. Get any employee id from your org:
   - **GET /api/employee**

3. Create attendance record:
   - **POST /api/attendance**
   Body:
   ```json
   {
     "userId": "<employee id from step 2>",
     "date": "2026-02-28",
     "status": "present"
   }
   ```

4. List attendance:
   - **GET /api/attendance**
   Expected: shows attendance records saved in DB.

5. Negative test:
   - Login as `orgemployee1A@demo.com`
   - Try **POST /api/attendance**
   Expected: ❌ 403

---

## Scenario 3: Tenant Isolation (Org A cannot touch Org B)
1. Login as `orgadminA@demo.com`
2. Try to update an Org B employee:
   - Use employee id from Org B
   - **PUT /api/employee/{id}**
   Expected: ❌ 404

3. Try to override Org B employee permissions:
   - **PUT /api/admin/users/{orgBUserId}/module-overrides**
   Expected: ❌ 404


---

## Scenario 4: Audit log (who accessed what)
1. Login as `orgadminA@demo.com`
2. Call any RBAC protected endpoint like:
   - GET /api/reports
   - GET /api/attendance
3. View audit logs:
   - GET /api/audit?limit=20
   Optional filters:
   - /api/audit?moduleKey=attendance
   - /api/audit?moduleKey=reports&action=read

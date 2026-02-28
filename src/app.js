const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const { notFound } = require('./middlewares/notFound');
const { errorHandler } = require('./middlewares/errorHandler');
const { attachAuditLogger } = require('./middlewares/auditLogger');

const authRoutes = require('./modules/auth/auth.routes');
const attendanceRoutes = require('./modules/attendance/attendance.routes');
const payrollRoutes = require('./modules/payroll/payroll.routes');
const reportsRoutes = require('./modules/reports/reports.routes');
const employeeRoutes = require('./modules/employee/employee.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const platformRoutes = require('./modules/platform/platform.routes');
const auditRoutes = require('./modules/audit/audit.routes');

function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan('combined'));
  app.use(attachAuditLogger());
// Swagger
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/payroll', payrollRoutes);
  app.use('/api/reports', reportsRoutes);
  app.use('/api/employee', employeeRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/platform', platformRoutes);
  app.use('/api/audit', auditRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };

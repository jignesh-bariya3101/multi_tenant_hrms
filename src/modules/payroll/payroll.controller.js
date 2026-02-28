const { created } = require('../../utils/response');

async function runPayroll(req, res) {
  const { month } = req.body;

  // Demo response
  return created(res, {
    orgId: req.user.orgId,
    permissions: req.permissions,
    jobId: 'payroll-job-demo-001',
    month,
    status: 'queued',
  }, 'Payroll run triggered');
}

module.exports = { runPayroll };

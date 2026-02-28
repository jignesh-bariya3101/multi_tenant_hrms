const { ok } = require('../../utils/response');

/**
 * Just return dummy reports data along with orgId and permissions for demonstration.
 * I will implement actual report generation logic in the future. 
 */
async function getReports(req, res) {
  return ok(res, {
    orgId: req.user.orgId,
    permissions: req.permissions,
    reports: [{ id: 'casc56sas56r1', name: 'Monthly Summary' }],
  }, 'Reports fetched');
}

module.exports = { getReports };

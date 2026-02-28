const { z } = require('zod');

const runPayrollSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'month must be YYYY-MM'),
});

module.exports = { runPayrollSchema };

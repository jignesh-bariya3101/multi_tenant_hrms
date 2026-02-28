const { z } = require('zod');

const createAttendanceSchema = z.object({
  userId: z.string().min(10),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  status: z.enum(['present', 'absent', 'leave']),
});

module.exports = { createAttendanceSchema };

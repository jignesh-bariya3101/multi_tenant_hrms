const { z } = require('zod');

const createOrgSchema = z.object({
  orgName: z.string().min(2),
  adminFullName: z.string().min(2),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(6),
});

module.exports = { createOrgSchema };

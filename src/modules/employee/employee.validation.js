const { z } = require('zod');

const updateEmployeeSchema = z.object({
  fullName: z.string().min(2).optional(),
  isActive: z.boolean().optional(),
});

const createEmployeeSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  roleKey: z.enum(['org_employee', 'org_manager', 'org_admin']).optional(),
});

module.exports = { updateEmployeeSchema, createEmployeeSchema };

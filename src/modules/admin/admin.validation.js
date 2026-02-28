const { z } = require('zod');

const overrideSchema = z.object({
  moduleKey: z.string().min(2),
  read: z.boolean().optional(),
  write: z.boolean().optional(),
  update: z.boolean().optional(),
  delete: z.boolean().optional(),
});

const updateUserOverridesSchema = z.object({
  overrides: z.array(overrideSchema).min(1),
});

module.exports = { updateUserOverridesSchema };

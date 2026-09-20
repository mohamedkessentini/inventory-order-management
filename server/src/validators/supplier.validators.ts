import { z } from 'zod';

export const createSupplierSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'name is required').max(150),
    contactEmail: z.string().email().optional(),
    phone: z.string().max(30).optional(),
  }),
});

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>['body'];

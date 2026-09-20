import { z } from 'zod';

export const createPurchaseOrderSchema = z.object({
  body: z.object({
    supplierId: z.string().min(1, 'supplierId is required'),
    lines: z
      .array(
        z.object({
          productId: z.string().min(1, 'productId is required'),
          quantityOrdered: z.number().int().positive('quantityOrdered must be positive'),
        }),
      )
      .min(1, 'at least one line is required'),
  }),
});

export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>['body'];

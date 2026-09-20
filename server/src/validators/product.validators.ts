import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    sku: z.string().min(1, 'sku is required').max(40),
    name: z.string().min(1, 'name is required').max(150),
    supplierId: z.string().min(1, 'supplierId is required'),
    unitCost: z.number().nonnegative('unitCost cannot be negative'),
    reorderThreshold: z.number().int().nonnegative().optional(),
  }),
});

export const adjustStockSchema = z.object({
  body: z.object({
    quantity: z.number().int('quantity must be a whole number'),
    reason: z.string().min(1, 'reason is required').max(200),
  }),
});

export type CreateProductInput = z.infer<typeof createProductSchema>['body'];
export type AdjustStockInput = z.infer<typeof adjustStockSchema>['body'];

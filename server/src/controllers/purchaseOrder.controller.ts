import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as purchaseOrderService from '../services/purchaseOrder.service';
import { parsePagination } from '../utils/pagination';
import { PurchaseOrderStatus } from '../models/PurchaseOrder';

export const create = asyncHandler(async (req: Request, res: Response) => {
  const order = await purchaseOrderService.createPurchaseOrder(req.userId!, req.body);
  res.status(201).json(order);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const order = await purchaseOrderService.getPurchaseOrderById(req.params.id as string);
  res.status(200).json(order);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = parsePagination(req.query);
  const result = await purchaseOrderService.listPurchaseOrders({
    supplierId: typeof req.query.supplierId === 'string' ? req.query.supplierId : undefined,
    status: typeof req.query.status === 'string' ? (req.query.status as PurchaseOrderStatus) : undefined,
    page,
    limit,
  });
  res.status(200).json(result);
});

export const markAsOrdered = asyncHandler(async (req: Request, res: Response) => {
  const order = await purchaseOrderService.markAsOrdered(req.params.id as string);
  res.status(200).json(order);
});

export const receive = asyncHandler(async (req: Request, res: Response) => {
  const order = await purchaseOrderService.receivePurchaseOrder(req.params.id as string);
  res.status(200).json(order);
});

export const cancel = asyncHandler(async (req: Request, res: Response) => {
  const order = await purchaseOrderService.cancelPurchaseOrder(req.params.id as string);
  res.status(200).json(order);
});

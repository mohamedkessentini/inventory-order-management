import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as supplierService from '../services/supplier.service';
import { parsePagination } from '../utils/pagination';

export const create = asyncHandler(async (req: Request, res: Response) => {
  const supplier = await supplierService.createSupplier(req.body);
  res.status(201).json(supplier);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const supplier = await supplierService.getSupplierById(req.params.id as string);
  res.status(200).json(supplier);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = parsePagination(req.query);
  const result = await supplierService.listSuppliers({
    search: typeof req.query.search === 'string' ? req.query.search : undefined,
    page,
    limit,
  });
  res.status(200).json(result);
});

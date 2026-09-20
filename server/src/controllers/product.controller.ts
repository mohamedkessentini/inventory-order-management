import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as productService from '../services/product.service';
import { parsePagination } from '../utils/pagination';

export const create = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.createProduct(req.body);
  res.status(201).json(product);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.getProductById(req.params.id as string);
  res.status(200).json(product);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = parsePagination(req.query);
  const result = await productService.listProducts({
    supplierId: typeof req.query.supplierId === 'string' ? req.query.supplierId : undefined,
    search: typeof req.query.search === 'string' ? req.query.search : undefined,
    lowStockOnly: req.query.lowStockOnly === 'true',
    page,
    limit,
  });
  res.status(200).json(result);
});

export const adjustStock = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.adjustStock(req.params.id as string, req.body.quantity, req.body.reason);
  res.status(200).json(product);
});

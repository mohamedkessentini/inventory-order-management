import { Product, ProductDocument } from '../models/Product';
import { ApiError } from '../utils/ApiError';
import { CreateProductInput } from '../validators/product.validators';
import { getSupplierById } from './supplier.service';
import { Page } from './supplier.service';
import { logger } from '../utils/logger';

export interface ListProductsOptions {
  supplierId?: string;
  search?: string;
  lowStockOnly?: boolean;
  page: number;
  limit: number;
}

export async function createProduct(input: CreateProductInput): Promise<ProductDocument> {
  await getSupplierById(input.supplierId); // ensures the supplier exists

  const existing = await Product.findOne({ sku: input.sku.toUpperCase() });
  if (existing) {
    throw ApiError.conflict(`Product already exists with sku: ${input.sku}`);
  }

  return Product.create({
    sku: input.sku.toUpperCase(),
    name: input.name,
    supplier: input.supplierId,
    unitCost: input.unitCost,
    reorderThreshold: input.reorderThreshold ?? 10,
  });
}

export async function getProductById(id: string): Promise<ProductDocument> {
  const product = await Product.findById(id);
  if (!product) {
    throw ApiError.notFound('Product', id);
  }
  return product;
}

export async function listProducts(options: ListProductsOptions): Promise<Page<ProductDocument>> {
  const filter: Record<string, unknown> = {};
  if (options.supplierId) filter.supplier = options.supplierId;
  if (options.search) {
    filter.$or = [
      { name: { $regex: options.search, $options: 'i' } },
      { sku: { $regex: options.search, $options: 'i' } },
    ];
  }
  if (options.lowStockOnly) {
    filter.$expr = { $lte: ['$quantityInStock', '$reorderThreshold'] };
  }

  const skip = (options.page - 1) * options.limit;
  const [content, totalElements] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(options.limit),
    Product.countDocuments(filter),
  ]);

  return {
    content,
    page: options.page,
    limit: options.limit,
    totalElements,
    totalPages: Math.max(1, Math.ceil(totalElements / options.limit)),
  };
}

/** Manual stock correction (e.g. after a physical count), independent of purchase order receiving. */
export async function adjustStock(id: string, quantity: number, reason: string): Promise<ProductDocument> {
  const product = await getProductById(id);
  const newQuantity = product.quantityInStock + quantity;
  if (newQuantity < 0) {
    throw ApiError.unprocessable(
      `Cannot adjust stock by ${quantity}: would result in a negative quantity (currently ${product.quantityInStock})`,
    );
  }
  product.quantityInStock = newQuantity;
  await product.save();
  logger.info(`Stock adjusted for product ${product.sku}: ${quantity >= 0 ? '+' : ''}${quantity} (${reason}), new quantity=${newQuantity}`);
  return product;
}

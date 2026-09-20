import { Supplier, SupplierDocument } from '../models/Supplier';
import { ApiError } from '../utils/ApiError';
import { CreateSupplierInput } from '../validators/supplier.validators';

export interface Page<T> {
  content: T[];
  page: number;
  limit: number;
  totalElements: number;
  totalPages: number;
}

export interface ListSuppliersOptions {
  search?: string;
  page: number;
  limit: number;
}

export async function createSupplier(input: CreateSupplierInput): Promise<SupplierDocument> {
  return Supplier.create(input);
}

export async function getSupplierById(id: string): Promise<SupplierDocument> {
  const supplier = await Supplier.findById(id);
  if (!supplier) {
    throw ApiError.notFound('Supplier', id);
  }
  return supplier;
}

export async function listSuppliers(options: ListSuppliersOptions): Promise<Page<SupplierDocument>> {
  const filter: Record<string, unknown> = {};
  if (options.search) {
    filter.name = { $regex: options.search, $options: 'i' };
  }

  const skip = (options.page - 1) * options.limit;
  const [content, totalElements] = await Promise.all([
    Supplier.find(filter).sort({ createdAt: -1 }).skip(skip).limit(options.limit),
    Supplier.countDocuments(filter),
  ]);

  return {
    content,
    page: options.page,
    limit: options.limit,
    totalElements,
    totalPages: Math.max(1, Math.ceil(totalElements / options.limit)),
  };
}

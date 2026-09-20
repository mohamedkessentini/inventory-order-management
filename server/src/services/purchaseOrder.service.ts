import { PurchaseOrder, PurchaseOrderDocument, PurchaseOrderLine, PurchaseOrderStatus } from '../models/PurchaseOrder';
import { Product } from '../models/Product';
import { ApiError } from '../utils/ApiError';
import { CreatePurchaseOrderInput } from '../validators/purchaseOrder.validators';
import { getSupplierById } from './supplier.service';
import { Page } from './supplier.service';
import { logger } from '../utils/logger';

export interface ListPurchaseOrdersOptions {
  supplierId?: string;
  status?: PurchaseOrderStatus;
  page: number;
  limit: number;
}

/**
 * Creates a DRAFT purchase order. Line unit costs are snapshotted from the product's current
 * unitCost at creation time, so a later price change doesn't retroactively alter an existing order.
 */
export async function createPurchaseOrder(
  userId: string,
  input: CreatePurchaseOrderInput,
): Promise<PurchaseOrderDocument> {
  await getSupplierById(input.supplierId);

  const lines: PurchaseOrderLine[] = [];
  for (const line of input.lines) {
    const product = await Product.findById(line.productId);
    if (!product) {
      throw ApiError.notFound('Product', line.productId);
    }
    if (product.supplier.toString() !== input.supplierId) {
      throw ApiError.unprocessable(`Product ${product.sku} is not supplied by this supplier`);
    }
    lines.push({ product: product._id, quantityOrdered: line.quantityOrdered, unitCost: product.unitCost });
  }

  const totalCost = Math.round(lines.reduce((sum, l) => sum + l.quantityOrdered * l.unitCost, 0) * 100) / 100;
  const orderNumber = await nextOrderNumber();

  const order = await PurchaseOrder.create({
    orderNumber,
    supplier: input.supplierId,
    status: 'DRAFT',
    lines,
    totalCost,
    createdBy: userId,
  });
  logger.info(`Created purchase order #${orderNumber} (status=DRAFT, totalCost=${totalCost})`);
  return order;
}

export async function markAsOrdered(id: string): Promise<PurchaseOrderDocument> {
  const order = await getPurchaseOrderById(id);
  if (order.status !== 'DRAFT') {
    throw ApiError.conflict(`Cannot mark as ORDERED: order is currently ${order.status}`);
  }
  order.status = 'ORDERED';
  order.orderedAt = new Date();
  await order.save();
  return order;
}

/**
 * Receives a purchase order: atomically flips DRAFT/ORDERED... -> RECEIVED first (matching the
 * current status again at write time, so two concurrent requests can't both succeed), and only
 * then increments each product's stock. This guarantees a purchase order's stock is applied
 * exactly once even under concurrent "receive" requests.
 */
export async function receivePurchaseOrder(id: string): Promise<PurchaseOrderDocument> {
  const existing = await getPurchaseOrderById(id);
  if (existing.status !== 'ORDERED') {
    throw ApiError.conflict(`Cannot receive: order is currently ${existing.status}, expected ORDERED`);
  }

  const claimed = await PurchaseOrder.findOneAndUpdate(
    { _id: id, status: 'ORDERED' },
    { $set: { status: 'RECEIVED', receivedAt: new Date() } },
    { new: true },
  );
  if (!claimed) {
    throw ApiError.conflict('This order was already received by another request');
  }

  for (const line of claimed.lines) {
    await Product.updateOne({ _id: line.product }, { $inc: { quantityInStock: line.quantityOrdered } });
  }

  logger.info(`Received purchase order #${claimed.orderNumber}: stock updated for ${claimed.lines.length} product(s)`);
  return claimed;
}

export async function cancelPurchaseOrder(id: string): Promise<PurchaseOrderDocument> {
  const order = await getPurchaseOrderById(id);
  if (order.status === 'RECEIVED') {
    throw ApiError.conflict('Cannot cancel an order that has already been received');
  }
  order.status = 'CANCELLED';
  await order.save();
  return order;
}

export async function getPurchaseOrderById(id: string): Promise<PurchaseOrderDocument> {
  const order = await PurchaseOrder.findById(id);
  if (!order) {
    throw ApiError.notFound('PurchaseOrder', id);
  }
  return order;
}

export async function listPurchaseOrders(options: ListPurchaseOrdersOptions): Promise<Page<PurchaseOrderDocument>> {
  const filter: Record<string, unknown> = {};
  if (options.supplierId) filter.supplier = options.supplierId;
  if (options.status) filter.status = options.status;

  const skip = (options.page - 1) * options.limit;
  const [content, totalElements] = await Promise.all([
    PurchaseOrder.find(filter).sort({ orderNumber: -1 }).skip(skip).limit(options.limit),
    PurchaseOrder.countDocuments(filter),
  ]);

  return {
    content,
    page: options.page,
    limit: options.limit,
    totalElements,
    totalPages: Math.max(1, Math.ceil(totalElements / options.limit)),
  };
}

async function nextOrderNumber(): Promise<number> {
  const last = await PurchaseOrder.findOne().sort({ orderNumber: -1 });
  return (last?.orderNumber ?? 0) + 1;
}

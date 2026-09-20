import {
  cancelPurchaseOrder,
  createPurchaseOrder,
  markAsOrdered,
  receivePurchaseOrder,
} from '../../src/services/purchaseOrder.service';
import { Product } from '../../src/models/Product';
import { ApiError } from '../../src/utils/ApiError';
import { createTestProduct, createTestSupplier, createTestUser } from '../helpers';

describe('purchaseOrder.service createPurchaseOrder', () => {
  it('snapshots unit cost from the product and computes the total', async () => {
    const user = await createTestUser();
    const supplier = await createTestSupplier();
    const product = await createTestProduct(supplier._id.toString(), { unitCost: 12.5 });

    const order = await createPurchaseOrder(user._id.toString(), {
      supplierId: supplier._id.toString(),
      lines: [{ productId: product._id.toString(), quantityOrdered: 4 }],
    });

    expect(order.status).toBe('DRAFT');
    expect(order.lines[0]!.unitCost).toBe(12.5);
    expect(order.totalCost).toBe(50);
    expect(order.orderNumber).toBe(1);
  });

  it('rejects a line whose product belongs to a different supplier', async () => {
    const user = await createTestUser();
    const supplierA = await createTestSupplier({ name: 'Supplier A' });
    const supplierB = await createTestSupplier({ name: 'Supplier B' });
    const product = await createTestProduct(supplierA._id.toString());

    await expect(
      createPurchaseOrder(user._id.toString(), {
        supplierId: supplierB._id.toString(),
        lines: [{ productId: product._id.toString(), quantityOrdered: 1 }],
      }),
    ).rejects.toThrow('is not supplied by this supplier');
  });

  it('increments order numbers across multiple orders', async () => {
    const user = await createTestUser();
    const supplier = await createTestSupplier();
    const product = await createTestProduct(supplier._id.toString());

    const first = await createPurchaseOrder(user._id.toString(), {
      supplierId: supplier._id.toString(),
      lines: [{ productId: product._id.toString(), quantityOrdered: 1 }],
    });
    const second = await createPurchaseOrder(user._id.toString(), {
      supplierId: supplier._id.toString(),
      lines: [{ productId: product._id.toString(), quantityOrdered: 1 }],
    });

    expect(first.orderNumber).toBe(1);
    expect(second.orderNumber).toBe(2);
  });
});

describe('purchaseOrder.service status workflow', () => {
  async function setupDraftOrder(quantityOrdered = 5) {
    const user = await createTestUser();
    const supplier = await createTestSupplier();
    const product = await createTestProduct(supplier._id.toString(), { quantityInStock: 3, reorderThreshold: 10 });
    const order = await createPurchaseOrder(user._id.toString(), {
      supplierId: supplier._id.toString(),
      lines: [{ productId: product._id.toString(), quantityOrdered }],
    });
    return { user, supplier, product, order };
  }

  it('receiving an ORDERED order increments product stock', async () => {
    const { product, order } = await setupDraftOrder(5);
    await markAsOrdered(order._id.toString());

    const received = await receivePurchaseOrder(order._id.toString());
    expect(received.status).toBe('RECEIVED');

    const reloadedProduct = await Product.findById(product._id);
    expect(reloadedProduct!.quantityInStock).toBe(8); // 3 + 5
  });

  it('rejects receiving a DRAFT order (must be ORDERED first)', async () => {
    const { order } = await setupDraftOrder();

    await expect(receivePurchaseOrder(order._id.toString())).rejects.toThrow('expected ORDERED');
  });

  it('rejects receiving the same order twice', async () => {
    const { order } = await setupDraftOrder();
    await markAsOrdered(order._id.toString());
    await receivePurchaseOrder(order._id.toString());

    await expect(receivePurchaseOrder(order._id.toString())).rejects.toThrow(ApiError);
  });

  it('rejects marking an already-ORDERED order as ORDERED again', async () => {
    const { order } = await setupDraftOrder();
    await markAsOrdered(order._id.toString());

    await expect(markAsOrdered(order._id.toString())).rejects.toThrow('Cannot mark as ORDERED');
  });

  it('cancelling a DRAFT order works, cancelling a RECEIVED order is rejected', async () => {
    const { order } = await setupDraftOrder();
    const cancelled = await cancelPurchaseOrder(order._id.toString());
    expect(cancelled.status).toBe('CANCELLED');

    const { order: order2 } = await setupDraftOrder();
    await markAsOrdered(order2._id.toString());
    await receivePurchaseOrder(order2._id.toString());

    await expect(cancelPurchaseOrder(order2._id.toString())).rejects.toThrow('already been received');
  });
});

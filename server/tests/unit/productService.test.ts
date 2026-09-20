import { adjustStock, listProducts } from '../../src/services/product.service';
import { ApiError } from '../../src/utils/ApiError';
import { createTestProduct, createTestSupplier } from '../helpers';

describe('product.service adjustStock', () => {
  it('increases stock with a positive adjustment', async () => {
    const supplier = await createTestSupplier();
    const product = await createTestProduct(supplier._id.toString(), { quantityInStock: 10 });

    const updated = await adjustStock(product._id.toString(), 5, 'Physical count correction');

    expect(updated.quantityInStock).toBe(15);
  });

  it('decreases stock with a negative adjustment', async () => {
    const supplier = await createTestSupplier();
    const product = await createTestProduct(supplier._id.toString(), { quantityInStock: 10 });

    const updated = await adjustStock(product._id.toString(), -4, 'Damaged goods written off');

    expect(updated.quantityInStock).toBe(6);
  });

  it('rejects an adjustment that would make stock negative', async () => {
    const supplier = await createTestSupplier();
    const product = await createTestProduct(supplier._id.toString(), { quantityInStock: 3 });

    await expect(adjustStock(product._id.toString(), -10, 'Oops')).rejects.toThrow(ApiError);
  });
});

describe('product.service listProducts low-stock filter', () => {
  it('returns only products at or below their reorder threshold', async () => {
    const supplier = await createTestSupplier();
    await createTestProduct(supplier._id.toString(), { sku: 'LOW-1', quantityInStock: 2, reorderThreshold: 10 });
    await createTestProduct(supplier._id.toString(), { sku: 'OK-1', quantityInStock: 50, reorderThreshold: 10 });

    const result = await listProducts({ lowStockOnly: true, page: 1, limit: 20 });

    expect(result.content).toHaveLength(1);
    expect(result.content[0]!.sku).toBe('LOW-1');
  });
});

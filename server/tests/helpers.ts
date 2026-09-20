import { User } from '../src/models/User';
import { Supplier } from '../src/models/Supplier';
import { Product } from '../src/models/Product';

export async function createTestUser(overrides: Partial<{ name: string; email: string }> = {}) {
  return User.create({
    name: overrides.name ?? 'Mohamed Kessentini',
    email: overrides.email ?? `user-${Date.now()}-${Math.random()}@example.com`,
    passwordHash: 'irrelevant-for-service-tests',
  });
}

export async function createTestSupplier(overrides: Partial<{ name: string }> = {}) {
  return Supplier.create({ name: overrides.name ?? 'Acme Supplies' });
}

export async function createTestProduct(
  supplierId: string,
  overrides: Partial<{ sku: string; name: string; unitCost: number; reorderThreshold: number; quantityInStock: number }> = {},
) {
  return Product.create({
    sku: overrides.sku ?? `SKU-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    name: overrides.name ?? 'Widget',
    supplier: supplierId,
    unitCost: overrides.unitCost ?? 5,
    reorderThreshold: overrides.reorderThreshold ?? 10,
    quantityInStock: overrides.quantityInStock ?? 0,
  });
}

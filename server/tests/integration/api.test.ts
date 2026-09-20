import request from 'supertest';
import { createApp } from '../../src/app';

const app = createApp();

async function registerAndLogin() {
  const email = `staff-${Date.now()}@example.com`;
  const res = await request(app).post('/api/auth/register').send({
    name: 'Mohamed Kessentini',
    email,
    password: 'super-secret-1',
  });
  return { token: res.body.token as string, email };
}

describe('Full API flow: auth -> supplier -> product -> purchase order -> receive', () => {
  it('rejects protected routes without a token', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(401);
  });

  it('completes the full purchasing flow end to end', async () => {
    const { token } = await registerAndLogin();
    const auth = { Authorization: `Bearer ${token}` };

    const supplierRes = await request(app).post('/api/suppliers').set(auth).send({ name: 'Acme Supplies' });
    expect(supplierRes.status).toBe(201);
    const supplierId = supplierRes.body._id;

    const productRes = await request(app)
      .post('/api/products')
      .set(auth)
      .send({ sku: 'widget-1', name: 'Widget', supplierId, unitCost: 10, reorderThreshold: 5 });
    expect(productRes.status).toBe(201);
    expect(productRes.body.sku).toBe('WIDGET-1'); // uppercased
    const productId = productRes.body._id;

    const orderRes = await request(app)
      .post('/api/purchase-orders')
      .set(auth)
      .send({ supplierId, lines: [{ productId, quantityOrdered: 20 }] });
    expect(orderRes.status).toBe(201);
    expect(orderRes.body.totalCost).toBe(200);
    const orderId = orderRes.body._id;

    const orderedRes = await request(app).post(`/api/purchase-orders/${orderId}/order`).set(auth);
    expect(orderedRes.status).toBe(200);
    expect(orderedRes.body.status).toBe('ORDERED');

    const receivedRes = await request(app).post(`/api/purchase-orders/${orderId}/receive`).set(auth);
    expect(receivedRes.status).toBe(200);
    expect(receivedRes.body.status).toBe('RECEIVED');

    const productAfter = await request(app).get(`/api/products/${productId}`).set(auth);
    expect(productAfter.body.quantityInStock).toBe(20);

    // Receiving again must fail - stock must not be double-applied.
    const secondReceive = await request(app).post(`/api/purchase-orders/${orderId}/receive`).set(auth);
    expect(secondReceive.status).toBe(409);
  });

  it('flags a low-stock product via the lowStockOnly filter', async () => {
    const { token } = await registerAndLogin();
    const auth = { Authorization: `Bearer ${token}` };

    const supplierRes = await request(app).post('/api/suppliers').set(auth).send({ name: 'Low Stock Supplier' });
    const supplierId = supplierRes.body._id;

    await request(app)
      .post('/api/products')
      .set(auth)
      .send({ sku: 'low-1', name: 'Low Stock Item', supplierId, unitCost: 2, reorderThreshold: 10 });

    const res = await request(app).get('/api/products?lowStockOnly=true').set(auth);
    expect(res.status).toBe(200);
    expect(res.body.content.some((p: { sku: string }) => p.sku === 'LOW-1')).toBe(true);
  });

  it('returns 400 with field errors for an invalid registration payload', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: '', email: 'not-an-email', password: '1' });

    expect(res.status).toBe(400);
    expect(res.body.fieldErrors.length).toBeGreaterThan(0);
  });

  it('rejects a purchase order line for a product from a different supplier', async () => {
    const { token } = await registerAndLogin();
    const auth = { Authorization: `Bearer ${token}` };

    const supplierA = await request(app).post('/api/suppliers').set(auth).send({ name: 'Supplier A' });
    const supplierB = await request(app).post('/api/suppliers').set(auth).send({ name: 'Supplier B' });
    const product = await request(app)
      .post('/api/products')
      .set(auth)
      .send({ sku: 'cross-1', name: 'Cross Supplier Item', supplierId: supplierA.body._id, unitCost: 1 });

    const res = await request(app)
      .post('/api/purchase-orders')
      .set(auth)
      .send({ supplierId: supplierB.body._id, lines: [{ productId: product.body._id, quantityOrdered: 1 }] });

    expect(res.status).toBe(422);
  });
});

import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { PurchaseOrderService } from '../../../core/services/purchase-order.service';
import { ProductService } from '../../../core/services/product.service';
import { SupplierService } from '../../../core/services/supplier.service';
import { PurchaseOrder, Product, Supplier } from '../../../core/models';
import { extractErrorMessage } from '../../../core/utils/api-error';

@Component({
  selector: 'app-purchase-order-detail',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatButtonModule, MatTableModule, MatChipsModule],
  templateUrl: './purchase-order-detail.html',
  styleUrl: './purchase-order-detail.scss',
})
export class PurchaseOrderDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly orderService = inject(PurchaseOrderService);
  private readonly productService = inject(ProductService);
  private readonly supplierService = inject(SupplierService);

  readonly displayedColumns = ['product', 'quantityOrdered', 'unitCost', 'amount'];
  readonly order = signal<PurchaseOrder | null>(null);
  readonly products = signal<Product[]>([]);
  readonly suppliers = signal<Supplier[]>([]);
  readonly actionError = signal<string | null>(null);
  readonly acting = signal(false);

  constructor() {
    this.productService.list({ page: 1, limit: 200 }).subscribe((result) => this.products.set(result.content));
    this.supplierService.list({ page: 1, limit: 100 }).subscribe((result) => this.suppliers.set(result.content));
    this.load();
  }

  private load(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.orderService.getById(id).subscribe((order) => this.order.set(order));
  }

  productName(id: string): string {
    return this.products().find((p) => p._id === id)?.name ?? id;
  }

  supplierName(id: string): string {
    return this.suppliers().find((s) => s._id === id)?.name ?? '—';
  }

  amount(quantityOrdered: number, unitCost: number): number {
    return Math.round(quantityOrdered * unitCost * 100) / 100;
  }

  markAsOrdered(): void {
    this.runAction(() => this.orderService.markAsOrdered(this.order()!._id));
  }

  receive(): void {
    this.runAction(() => this.orderService.receive(this.order()!._id));
  }

  cancel(): void {
    this.runAction(() => this.orderService.cancel(this.order()!._id));
  }

  private runAction(action: () => ReturnType<PurchaseOrderService['receive']>): void {
    this.actionError.set(null);
    this.acting.set(true);
    action().subscribe({
      next: (order) => {
        this.order.set(order);
        this.acting.set(false);
      },
      error: (err) => {
        this.actionError.set(extractErrorMessage(err));
        this.acting.set(false);
      },
    });
  }
}

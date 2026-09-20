import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { PurchaseOrderService } from '../../../core/services/purchase-order.service';
import { SupplierService } from '../../../core/services/supplier.service';
import { ProductService } from '../../../core/services/product.service';
import { PurchaseOrder, Supplier, Product } from '../../../core/models';
import { extractErrorMessage } from '../../../core/utils/api-error';

@Component({
  selector: 'app-purchase-order-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatCardModule,
    MatChipsModule,
  ],
  templateUrl: './purchase-order-list.html',
  styleUrl: './purchase-order-list.scss',
})
export class PurchaseOrderList {
  private readonly fb = inject(FormBuilder);
  private readonly orderService = inject(PurchaseOrderService);
  private readonly supplierService = inject(SupplierService);
  private readonly productService = inject(ProductService);

  readonly displayedColumns = ['orderNumber', 'supplier', 'status', 'totalCost', 'actions'];
  readonly orders = signal<PurchaseOrder[]>([]);
  readonly suppliers = signal<Supplier[]>([]);
  readonly products = signal<Product[]>([]);
  readonly totalElements = signal(0);
  readonly page = signal(1);
  readonly limit = signal(10);
  readonly loading = signal(false);
  readonly formError = signal<string | null>(null);
  readonly submitting = signal(false);

  readonly form = this.fb.nonNullable.group({
    supplierId: ['', [Validators.required]],
    lines: this.fb.array([this.createLine()]),
  });

  get lines() {
    return this.form.controls.lines;
  }

  constructor() {
    this.supplierService.list({ page: 1, limit: 100 }).subscribe((result) => this.suppliers.set(result.content));
    this.productService.list({ page: 1, limit: 200 }).subscribe((result) => this.products.set(result.content));
    this.load();
  }

  private createLine() {
    return this.fb.nonNullable.group({
      productId: ['', [Validators.required]],
      quantityOrdered: [1, [Validators.required, Validators.min(1)]],
    });
  }

  addLine(): void {
    this.lines.push(this.createLine());
  }

  removeLine(index: number): void {
    if (this.lines.length > 1) {
      this.lines.removeAt(index);
    }
  }

  productsForSupplier(): Product[] {
    const supplierId = this.form.controls.supplierId.value;
    return supplierId ? this.products().filter((p) => p.supplier === supplierId) : this.products();
  }

  supplierName(id: string): string {
    return this.suppliers().find((s) => s._id === id)?.name ?? '—';
  }

  load(): void {
    this.loading.set(true);
    this.orderService.list({ page: this.page(), limit: this.limit() }).subscribe({
      next: (result) => {
        this.orders.set(result.content);
        this.totalElements.set(result.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex + 1);
    this.limit.set(event.pageSize);
    this.load();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.formError.set(null);
    this.submitting.set(true);
    const raw = this.form.getRawValue();

    this.orderService.create({ supplierId: raw.supplierId, lines: raw.lines }).subscribe({
      next: () => {
        this.form.reset({ supplierId: '' });
        this.lines.clear();
        this.lines.push(this.createLine());
        this.submitting.set(false);
        this.page.set(1);
        this.load();
      },
      error: (err) => {
        this.formError.set(extractErrorMessage(err));
        this.submitting.set(false);
      },
    });
  }
}

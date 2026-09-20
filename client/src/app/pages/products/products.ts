import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { ProductService } from '../../core/services/product.service';
import { SupplierService } from '../../core/services/supplier.service';
import { Product, Supplier } from '../../core/models';
import { extractErrorMessage } from '../../core/utils/api-error';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
  ],
  templateUrl: './products.html',
  styleUrl: './products.scss',
})
export class Products {
  private readonly fb = inject(FormBuilder);
  private readonly productService = inject(ProductService);
  private readonly supplierService = inject(SupplierService);

  readonly displayedColumns = ['sku', 'name', 'supplier', 'unitCost', 'quantityInStock', 'status'];
  readonly products = signal<Product[]>([]);
  readonly suppliers = signal<Supplier[]>([]);
  readonly totalElements = signal(0);
  readonly page = signal(1);
  readonly limit = signal(10);
  readonly lowStockOnly = signal(false);
  readonly loading = signal(false);
  readonly formError = signal<string | null>(null);
  readonly submitting = signal(false);

  readonly form = this.fb.nonNullable.group({
    sku: ['', [Validators.required]],
    name: ['', [Validators.required]],
    supplierId: ['', [Validators.required]],
    unitCost: [0, [Validators.required, Validators.min(0)]],
    reorderThreshold: [10, [Validators.min(0)]],
  });

  constructor() {
    this.supplierService.list({ page: 1, limit: 100 }).subscribe((result) => this.suppliers.set(result.content));
    this.load();
  }

  supplierName(id: string): string {
    return this.suppliers().find((s) => s._id === id)?.name ?? '—';
  }

  load(): void {
    this.loading.set(true);
    this.productService
      .list({ page: this.page(), limit: this.limit(), lowStockOnly: this.lowStockOnly() || undefined })
      .subscribe({
        next: (result) => {
          this.products.set(result.content);
          this.totalElements.set(result.totalElements);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  toggleLowStock(checked: boolean): void {
    this.lowStockOnly.set(checked);
    this.page.set(1);
    this.load();
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

    this.productService
      .create({
        sku: raw.sku,
        name: raw.name,
        supplierId: raw.supplierId,
        unitCost: raw.unitCost,
        reorderThreshold: raw.reorderThreshold,
      })
      .subscribe({
        next: () => {
          this.form.reset({ unitCost: 0, reorderThreshold: 10 });
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

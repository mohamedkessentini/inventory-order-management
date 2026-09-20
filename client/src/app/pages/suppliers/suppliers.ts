import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { SupplierService } from '../../core/services/supplier.service';
import { Supplier } from '../../core/models';
import { extractErrorMessage } from '../../core/utils/api-error';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatCardModule,
  ],
  templateUrl: './suppliers.html',
  styleUrl: './suppliers.scss',
})
export class Suppliers {
  private readonly fb = inject(FormBuilder);
  private readonly supplierService = inject(SupplierService);

  readonly displayedColumns = ['name', 'contactEmail', 'phone'];
  readonly suppliers = signal<Supplier[]>([]);
  readonly totalElements = signal(0);
  readonly page = signal(1);
  readonly limit = signal(10);
  readonly loading = signal(false);
  readonly formError = signal<string | null>(null);
  readonly submitting = signal(false);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    contactEmail: [''],
    phone: [''],
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.supplierService.list({ page: this.page(), limit: this.limit() }).subscribe({
      next: (result) => {
        this.suppliers.set(result.content);
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
    const { name, contactEmail, phone } = this.form.getRawValue();

    this.supplierService
      .create({ name, contactEmail: contactEmail || undefined, phone: phone || undefined })
      .subscribe({
        next: () => {
          this.form.reset();
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

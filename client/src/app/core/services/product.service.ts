import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Page, Product } from '../models';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl = `${environment.apiUrl}/products`;

  list(params: {
    supplierId?: string;
    search?: string;
    lowStockOnly?: boolean;
    page?: number;
    limit?: number;
  }): Observable<Page<Product>> {
    let httpParams = new HttpParams();
    if (params.supplierId) httpParams = httpParams.set('supplierId', params.supplierId);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.lowStockOnly) httpParams = httpParams.set('lowStockOnly', 'true');
    if (params.page) httpParams = httpParams.set('page', params.page);
    if (params.limit) httpParams = httpParams.set('limit', params.limit);
    return this.http.get<Page<Product>>(this.baseUrl, { params: httpParams });
  }

  create(input: {
    sku: string;
    name: string;
    supplierId: string;
    unitCost: number;
    reorderThreshold?: number;
  }): Observable<Product> {
    return this.http.post<Product>(this.baseUrl, input);
  }

  adjustStock(id: string, quantity: number, reason: string): Observable<Product> {
    return this.http.patch<Product>(`${this.baseUrl}/${id}/stock`, { quantity, reason });
  }
}

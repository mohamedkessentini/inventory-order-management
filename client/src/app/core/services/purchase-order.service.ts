import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Page, PurchaseOrder, PurchaseOrderStatus } from '../models';

@Injectable({ providedIn: 'root' })
export class PurchaseOrderService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl = `${environment.apiUrl}/purchase-orders`;

  list(params: {
    supplierId?: string;
    status?: PurchaseOrderStatus;
    page?: number;
    limit?: number;
  }): Observable<Page<PurchaseOrder>> {
    let httpParams = new HttpParams();
    if (params.supplierId) httpParams = httpParams.set('supplierId', params.supplierId);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.page) httpParams = httpParams.set('page', params.page);
    if (params.limit) httpParams = httpParams.set('limit', params.limit);
    return this.http.get<Page<PurchaseOrder>>(this.baseUrl, { params: httpParams });
  }

  getById(id: string): Observable<PurchaseOrder> {
    return this.http.get<PurchaseOrder>(`${this.baseUrl}/${id}`);
  }

  create(input: {
    supplierId: string;
    lines: { productId: string; quantityOrdered: number }[];
  }): Observable<PurchaseOrder> {
    return this.http.post<PurchaseOrder>(this.baseUrl, input);
  }

  markAsOrdered(id: string): Observable<PurchaseOrder> {
    return this.http.post<PurchaseOrder>(`${this.baseUrl}/${id}/order`, {});
  }

  receive(id: string): Observable<PurchaseOrder> {
    return this.http.post<PurchaseOrder>(`${this.baseUrl}/${id}/receive`, {});
  }

  cancel(id: string): Observable<PurchaseOrder> {
    return this.http.post<PurchaseOrder>(`${this.baseUrl}/${id}/cancel`, {});
  }
}

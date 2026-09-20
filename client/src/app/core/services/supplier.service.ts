import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Page, Supplier } from '../models';

@Injectable({ providedIn: 'root' })
export class SupplierService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl = `${environment.apiUrl}/suppliers`;

  list(params: { search?: string; page?: number; limit?: number }): Observable<Page<Supplier>> {
    let httpParams = new HttpParams();
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.page) httpParams = httpParams.set('page', params.page);
    if (params.limit) httpParams = httpParams.set('limit', params.limit);
    return this.http.get<Page<Supplier>>(this.baseUrl, { params: httpParams });
  }

  create(input: { name: string; contactEmail?: string; phone?: string }): Observable<Supplier> {
    return this.http.post<Supplier>(this.baseUrl, input);
  }
}

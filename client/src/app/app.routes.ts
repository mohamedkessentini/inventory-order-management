import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register').then((m) => m.Register),
  },
  {
    path: '',
    loadComponent: () => import('./layout/layout').then((m) => m.Layout),
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'products' },
      {
        path: 'suppliers',
        loadComponent: () => import('./pages/suppliers/suppliers').then((m) => m.Suppliers),
      },
      {
        path: 'products',
        loadComponent: () => import('./pages/products/products').then((m) => m.Products),
      },
      {
        path: 'purchase-orders',
        loadComponent: () =>
          import('./pages/purchase-orders/list/purchase-order-list').then((m) => m.PurchaseOrderList),
      },
      {
        path: 'purchase-orders/:id',
        loadComponent: () =>
          import('./pages/purchase-orders/detail/purchase-order-detail').then((m) => m.PurchaseOrderDetail),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];

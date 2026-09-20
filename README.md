# Inventory & Order Management System

Full-stack MEAN app for managing suppliers, products and purchase orders — basically a small
warehouse/stock system. MongoDB, Express, Angular, Node, all TypeScript.

Third project in a small portfolio I'm building (Java/Spring, MERN, and this one). Not trying to be
a real warehouse system, but the stock/ordering logic is real, not just UI for show.

## How it works

1. Register/log in.
2. Add suppliers, and per supplier the products they provide (cost + reorder threshold).
3. Create a purchase order (DRAFT) for a supplier — pick products and quantities. Unit costs get
   snapshotted from the product at creation time so a later price change doesn't retroactively mess
   with an existing order.
4. Mark it ORDERED once you've actually placed it with the supplier.
5. Receive it when it arrives — stock gets incremented atomically and the order becomes RECEIVED.
   Can't be received twice, even if you double-click the button or two requests race.
6. Product list has a low-stock filter (items at or below their reorder threshold).

## Features

- JWT auth guarding everything except login/register
- CRUD for suppliers/products, full purchase-order lifecycle (DRAFT → ORDERED → RECEIVED/CANCELLED)
- The actual business rules: unit-cost snapshotting, atomic stock updates on receipt, a
  supplier/product consistency check (you can't order a product from a supplier that doesn't
  actually supply it)
- Low-stock filtering computed in MongoDB, not pulled into JS and filtered there
- Manual stock adjustment endpoint for physical counts
- Search/filter/pagination everywhere
- Zod validation, centralized error handling
- Angular Material UI with reactive forms, a dynamic FormArray for order line items
- Unit + integration tests
- Docker Compose, GitLab CI

## Architecture

```
Angular (services + RxJS)  →  Express API  →  Mongoose  →  MongoDB
```

Same backend layering as my other two projects — controller → service → model, services own the
Mongoose calls. On the Angular side, `core/services` are injectable services wrapping HttpClient,
`core/interceptors` handles attaching the JWT and logging out on 401, `pages` is one standalone
lazy-loaded component per resource.

## Stack

Angular 22 (standalone components, signals), TypeScript, Angular Material, RxJS, Reactive Forms.
Node/Express/TypeScript, Mongoose, JWT, bcrypt, Zod. MongoDB 7. Jest + Supertest +
mongodb-memory-server. Docker/Compose, GitLab CI.

## Running it

Node 20+ works fine for the server, but the Angular 22 CLI needs Node 22.22.3+ (or 24.15+, or 26+)
to run at all — that's why the client's Dockerfile is on `node:22-alpine` while the server's stays
on `node:20-alpine`.

```bash
cd server && npm install
cd ../client && npm install --legacy-peer-deps
```

(The `--legacy-peer-deps` flag works around an npm 11 bug — Arborist crashes on Angular 22's
optional Vitest peer deps. Not a problem with this project, just npm being npm.)

```bash
cp server/.env.example server/.env
```

Mongo via Docker:

```bash
docker run -d -p 27019:27017 --name inventory-mongo mongo:7
```

Then:

```bash
cd server && npm run dev     # http://localhost:4100
cd client && npx ng serve    # http://localhost:4200
```

## Docker Compose

```bash
cp .env.example .env
docker compose up --build
```

Frontend on `8091`, API on `4100`, Mongo on `27019` — shifted off the usual ports since I've got the
other two portfolio projects' stacks running on the same machine sometimes.

## Endpoints

Auth: `/api/auth/register`, `/api/auth/login`.

Everything else needs a bearer token: `/api/suppliers`, `/api/products` (supports
`?lowStockOnly=true`), `PATCH /api/products/:id/stock` for manual adjustments,
`/api/purchase-orders` plus `/order`, `/receive`, `/cancel` actions on a specific order.

## Tests

```bash
cd server
npm test
npm run lint
npm run typecheck

cd ../client
npx ng build   # typechecks the whole app, fails on template errors too
npx ng lint
```

No frontend unit tests here — Angular 22 switched its default runner to Vitest and I haven't set up
the browser provider package it needs. `ng build`'s full-project type checking is doing the job for
now.

## CI/CD

`.gitlab-ci.yml`: typecheck + build → lint → tests (JUnit reports) → Docker builds. Registry push is
a manual step, same reason as the other two projects (no creds on the free runners).

## Stuff I'd add if I kept going

- Multi-warehouse support (right now stock is a single global number per product)
- Partial receiving (a shipment that's short a few units)
- Role-based access — only managers can approve orders above some cost
- A proper audit trail for manual stock adjustments instead of just a logged reason

# Inventory & Order Management System

A full-stack MEAN application for managing suppliers, products, and purchase orders in a small
warehouse/e-commerce operation. Built with MongoDB, Express, Angular, and Node.js, all in
TypeScript.

This is a personal learning/portfolio project, not a production warehouse management system, but
the core stock/ordering logic (atomic stock updates, order status workflow) is real and tested.

## Overview

1. Register/log in as staff.
2. Add **suppliers** and, per supplier, the **products** they provide (with a cost and a reorder
   threshold).
3. Create a **purchase order** (DRAFT) for a supplier, listing which products and how many units to
   buy — unit costs are snapshotted from the product at creation time.
4. Mark the order **ORDERED** once it's actually placed with the supplier.
5. **Receive** the order once it arrives: each product's stock is incremented by the ordered
   quantity, atomically, and the order becomes RECEIVED — it can never be received twice.
6. The product list can be filtered to show only items at or below their reorder threshold.

## Features

- JWT authentication (register/login) guarding every non-auth route
- CRUD for suppliers and products; full purchase-order lifecycle (DRAFT → ORDERED → RECEIVED /
  CANCELLED)
- Real business logic: unit-cost snapshotting on order creation, atomic stock increment on receipt
  (an order can never be received twice, even under concurrent requests), a supplier/product
  consistency rule (an order line's product must actually belong to the order's supplier)
- Low-stock filtering (`quantityInStock <= reorderThreshold`) computed in MongoDB, not in app code
- Manual stock adjustment endpoint (e.g. after a physical count), with a reason logged
- Search (suppliers/products), filtering (by supplier/status), and pagination on every list endpoint
- Zod request validation with consistent field-level error responses
- Centralized error handling (404/400/401/409/422)
- Angular UI (Angular Material) with reactive forms, a dynamic `FormArray` for purchase-order lines,
  and RxJS-based data loading through injectable services
- Unit tests (business logic, in-memory MongoDB) + integration tests (full HTTP flow, Supertest)
- Docker, Docker Compose (Mongo + API + nginx-served frontend), GitLab CI/CD

## Architecture

```
Angular (services + RxJS)  →  Express REST API  →  Mongoose  →  MongoDB
        ↑                          ↑
  Reactive Forms            Controller → Service → Model
  HTTP interceptor (JWT)    (same layering as the other two projects)
```

- **`server/src/models`** — Mongoose schemas (User, Supplier, Product, PurchaseOrder).
- **`server/src/services`** — business logic; the only layer that touches models directly.
- **`server/src/controllers`** — thin HTTP adapters.
- **`server/src/middleware`** — JWT auth, Zod validation, centralized error handler.
- **`client/src/app/core/services`** — one injectable Angular service per resource, each returning
  RxJS `Observable`s from `HttpClient`.
- **`client/src/app/core/interceptors/auth.interceptor.ts`** — attaches the JWT to every outgoing
  request and logs the user out on a 401.
- **`client/src/app/pages`** — one standalone, lazy-loaded component per resource.

## Tech Stack

| Layer      | Technology                                                              |
|------------|----------------------------------------------------------------------------|
| Frontend   | Angular 22 (standalone components, signals), TypeScript, Angular Material, RxJS, Reactive Forms |
| Backend    | Node.js, Express, TypeScript, Mongoose, JWT, bcrypt, Zod                 |
| Database   | MongoDB 7                                                                  |
| Testing    | Jest, Supertest, mongodb-memory-server                                    |
| Containers | Docker, Docker Compose                                                     |
| CI/CD      | GitLab CI/CD                                                                |

## Project Structure

```
inventory-order-management/
├── server/
│   ├── src/
│   │   ├── config/        # env, MongoDB connection
│   │   ├── models/        # Mongoose schemas
│   │   ├── services/      # business logic
│   │   ├── controllers/   # HTTP handlers
│   │   ├── routes/        # Express routers
│   │   ├── middleware/    # auth, validation, error handling
│   │   ├── validators/    # Zod schemas
│   │   └── utils/         # ApiError, pagination, logger
│   ├── tests/
│   │   ├── unit/          # business logic tests (in-memory MongoDB)
│   │   └── integration/   # full HTTP flow tests (Supertest)
│   └── Dockerfile
├── client/
│   ├── src/app/
│   │   ├── core/
│   │   │   ├── models/        # shared TypeScript interfaces
│   │   │   ├── services/      # HttpClient wrappers per resource
│   │   │   ├── guards/        # authGuard (route protection)
│   │   │   └── interceptors/  # JWT attachment + 401 handling
│   │   ├── layout/         # authenticated app shell (toolbar + router-outlet)
│   │   └── pages/          # login, register, suppliers, products, purchase-orders
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
├── .gitlab-ci.yml
├── CV_DESCRIPTION.md
└── INTERVIEW_PREPARATION.md
```

## Prerequisites

- Node.js 20+
- Angular CLI (`npm install -g @angular/cli`, or use `npx ng`)
- Docker Desktop (for MongoDB locally, or the full stack via Compose)

## Installation

```bash
git clone <your-repo-url>
cd inventory-order-management
cd server && npm install
cd ../client && npm install --legacy-peer-deps
```

> The client install needs `--legacy-peer-deps` to work around a known npm 11 Arborist crash
> (`Cannot read properties of null (reading 'edgesOut')`) triggered by Angular 22's optional
> Vitest peer dependencies — an npm bug, not a problem with this project's dependencies.

## Configuration

```bash
cp server/.env.example server/.env
```

The client has no `.env` — Angular bakes `VITE`-style config into the build at compile time via
`src/environments/environment.ts` (see Docker section below for how the containerized build
overrides the API URL).

## Running locally

Start MongoDB (Docker is simplest):

```bash
docker run -d -p 27019:27017 --name inventory-mongo mongo:7
```

Then, in two terminals:

```bash
cd server && npm run dev     # http://localhost:4100
cd client && npx ng serve    # http://localhost:4200
```

## Docker

Each service has its own Dockerfile (multi-stage: build, then a minimal runtime image — Node
Alpine for the API, nginx Alpine serving the Angular production build for the client).

```bash
docker build -t inventory-server ./server
docker build --build-arg API_URL=http://localhost:4100/api -t inventory-client ./client
```

## Docker Compose

Runs MongoDB, the API, and the frontend (served by nginx) together:

```bash
cp .env.example .env
docker compose up --build
```

- Frontend: `http://localhost:8091`
- API: `http://localhost:4100/api`
- MongoDB: `localhost:27019`

Ports default to 8091/4100/27019 to avoid clashing with the other two portfolio projects and any
other local services; override via `.env` (`CLIENT_PORT`, `API_PORT`, `MONGO_PORT`).

## API Documentation

Key endpoints (all require `Authorization: Bearer <token>` except `/api/auth/*`):

| Method | Path                                       | Description                                  |
|--------|-----------------------------------------------|-------------------------------------------------|
| POST   | `/api/auth/register`                          | Create a staff account, returns a JWT            |
| POST   | `/api/auth/login`                             | Log in, returns a JWT                            |
| GET/POST | `/api/suppliers`                            | List (search/paginate) / create suppliers        |
| GET/POST | `/api/products`                             | List (filter, `lowStockOnly=true`) / create products |
| PATCH  | `/api/products/:id/stock`                     | Manual stock adjustment (+/-), with a reason      |
| GET/POST | `/api/purchase-orders`                      | List (filter) / create a DRAFT purchase order     |
| POST   | `/api/purchase-orders/:id/order`               | DRAFT → ORDERED                                  |
| POST   | `/api/purchase-orders/:id/receive`             | ORDERED → RECEIVED, atomically updates stock      |
| POST   | `/api/purchase-orders/:id/cancel`              | Cancel a DRAFT/ORDERED order                      |

## Testing

```bash
cd server
npm test              # unit + integration (spins up an in-memory MongoDB automatically)
npm run lint
npm run typecheck

cd ../client
npx ng build           # fails the build on template/type errors across the whole app
```

> Angular 22 switched its default test runner to Vitest, which needs an extra browser-provider
> package (`@vitest/browser-playwright` or similar) not set up in this project — frontend unit
> tests are out of scope here, same as the MERN project's React frontend. `ng build`'s full-project
> type checking is the frontend's correctness gate.

## CI/CD

`.gitlab-ci.yml` runs, on every push: typecheck + build (server and client in parallel), lint,
unit+integration tests (with JUnit reports surfaced in the MR UI), then builds both Docker images.
Pushing the images to a registry is a manual gate (`docker-push`), since it needs registry
credentials as CI/CD variables that aren't available on GitLab.com's free shared runners by
default.

## Screenshots

Verified end-to-end through the real UI (not just curl): register → create supplier → create
product → create purchase order → mark as ordered → receive (stock updated) → low-stock filter,
both via `ng serve` + `npm run dev` and via the full `docker compose up` stack (nginx-served
Angular build talking to the containerized API).

## Future Improvements

- Multi-warehouse support (currently a single global stock quantity per product)
- Supplier-side partial receiving (receiving fewer units than ordered, e.g. a short shipment)
- Role-based access (e.g. only managers can approve purchase orders above a cost threshold)
- CSV export of low-stock products for a reorder report
- A `StockMovement` audit collection instead of a logged-only reason on manual adjustments

## What I Learned

- Structuring an Angular app around standalone, lazy-loaded components with `loadComponent()`
  routes instead of NgModules — the modern (Angular 15+) default, and a deliberately different
  implementation from the MERN project's React Router setup, not just "the same app in another
  framework."
- Writing an `HttpInterceptorFn` (Angular's newer functional interceptor API) to attach a JWT and
  handle 401s globally, the Angular equivalent of the MERN project's Axios interceptor — the same
  problem, different framework idiom (RxJS operators vs. Promise `.then`/`.catch`).
- Using Angular's reactive `FormArray` to let a purchase-order form have a variable number of line
  items (add/remove rows), each independently validated.
- The same atomic-update pattern (conditional `findOneAndUpdate` matching the expected current
  state) shows up a third time here, after the Java project's position updates and the MERN
  project's invoice-generation — a strong signal it's a general technique, not a one-off trick.
- Hit and worked around a real npm 11 bug (`Cannot read properties of null (reading 'edgesOut')`
  in npm's Arborist dependency resolver) triggered by Angular 22's default Vitest peer
  dependencies — `--legacy-peer-deps` was the practical fix; worth being able to explain the
  difference between "my dependency graph is broken" and "the package manager's resolver crashed."

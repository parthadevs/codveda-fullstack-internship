# Codveda Fullstack Internship — Level 1 Basic

Node.js + Express + Prisma + PostgreSQL backend with a vanilla JS frontend. Everything runs in Docker.

## What's in here

**Backend** (`level-1-basic/backend/`)
- Express server with TypeScript
- Prisma ORM talking to PostgreSQL
- Zod validation for request bodies
- Winston logging
- Products modules (CRUD)
- Global error handling
- Graceful shutdown on SIGTERM/SIGINT

**Frontend** (`level-1-basic/frontend/`)
- Plain HTML/CSS/JS, no framework
- Product table with stock meter and status badge
- Search by name and SKU, filter by status, sort by name, price, stock or date
- Pagination (10 per page)
- Add/edit product modal (name, SKU, price, stock, description)
- Status toggle switch right in the table row
- Delete confirmation dialog
- Toast notifications

**Docker**
- `docker-compose.yml` runs Postgres, the backend, and an nginx frontend
- nginx proxies `/api/v1` to the backend, so there are no CORS issues

## Prerequisites

- Docker & Docker Compose
- Node.js v22+ to run the backend without Docker

## Run with Docker

```bash
cd level-1-basic
cp backend/.env.example backend/.env
docker compose up -d
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:8080 |
| Backend API | http://localhost:3002 |
| PostgreSQL | localhost:5433 |

Port conflict? See [Troubleshooting](#troubleshooting).

## Run the backend locally (without Docker)

```bash
cd level-1-basic/backend
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npm run dev
```

Confirm it's alive: `http://localhost:3000/health`

## API

### Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/products` | List products |
| GET | `/api/v1/products/:id` | Get one product |
| POST | `/api/v1/products` | Create a product |
| PATCH | `/api/v1/products/:id` | Update a product |
| PATCH | `/api/v1/products/:id/status` | Flip `isActive` on/off |
| DELETE | `/api/v1/products/:id` | Delete a product |

`GET /api/v1/products` query params: `page`, `limit`, `search`, `category`, `isActive`, `minPrice`, `maxPrice`, `inStock`, `sortBy`, `order`.

### Health

`GET /health` returns `{"success": true, ...}` when the server is up.

## Project structure

```
level-1-basic/
├── backend/
│   ├── prisma/schema.prisma
│   ├── src/
│   │   ├── config/        (env, database)
│   │   ├── middlewares/   (error, not-found, validate)
│   │   ├── modules/       (products module)
│   │   ├── utils/         (app-error, async-handler, logger)
│   │   ├── app.ts
│   │   ├── server.ts
│   │   └── routes.ts
│   ├── tests/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
├── frontend/
│   ├── index.html
│   ├── css/style.css
│   ├── js/
│   │   ├── config.js
│   │   ├── api.js
│   │   └── app.js
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
└── README.md
```

## Database

The Prisma schema has `Product` models. Level 1 mainly uses Products;

```bash
cd backend
npx prisma migrate dev --name init   # create and apply a migration
npx prisma studio                    # browse data in the browser
```

## Testing

```bash
cd backend
npm run test:run
```

Tests use Vitest.

## Troubleshooting

**Port already in use.** Change the host side of the mapping in `docker-compose.yml` (`8081:80` for the frontend, `3001:3000` for the backend), then rebuild:

```bash
docker compose down
docker compose up -d --build
```

**Backend container crashing.** Check the logs:

```bash
docker compose logs backend
```

**Frontend can't reach the API.** Make sure the backend is healthy first, then check the nginx logs:

```bash
curl http://localhost:3002/health
docker compose logs frontend
```

## License

ISC
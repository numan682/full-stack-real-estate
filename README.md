# Home Real Estate - Laravel + Next.js Full Stack

Production-ready real-estate platform with:
- Laravel 12 backend (`API + auth + data + CMS services`)
- Next.js 16 frontend in `frontend/` (`public site + admin dashboard`)

## Stack

- Laravel `12.52.x`
- PHP `8.2+`
- MySQL/PostgreSQL/SQLite compatible schema
- Next.js `16.1.x`
- React `19`
- TypeScript `5.9`

## Architecture

- Laravel serves:
  - API endpoints under `/api/v1/*`
  - Admin API endpoints under `/api/v1/admin/*` (token-secured)
  - `/` redirects to `FRONTEND_URL` (Next.js app)
- Next.js serves:
  - Public website pages (template pages + dynamic homepage)
  - Full admin dashboard at `/admin/*`
  - CMS-driven homepage selection from Laravel (`/api/v1/cms/config`)

## Key Features

- Dynamic CMS controls from admin:
  - Select active home template (`home_01`, `index-2` ... `index-7`)
  - Toggle/reorder Home 01 sections
  - JSON payload overrides per Home 01 section
  - Global header/footer settings
- Next.js admin modules:
  - Auth login/logout
  - Dashboard stats + recent inquiries
  - CMS management
  - Property CRUD management
  - Inquiry status workflow (`new`, `contacted`, `resolved`, `spam`)
- Backend API foundation:
  - `GET /api/v1/properties`
  - `GET /api/v1/properties/{property-slug}`
  - `POST /api/v1/inquiries`
  - `GET /api/v1/cms/config`
  - `POST /api/v1/admin/auth/login`
  - `GET /api/v1/admin/auth/me`
  - `POST /api/v1/admin/auth/logout`
  - `GET /api/v1/admin/dashboard`
  - `GET|PUT /api/v1/admin/cms/*`
  - `GET|POST|PUT|DELETE /api/v1/admin/properties/*`
  - `GET /api/v1/admin/inquiries`
  - `PATCH /api/v1/admin/inquiries/{id}/status`
- Seeded admin user and seeded real-estate sample data
- Rate limiting and security headers middleware

## Project Structure

```text
app/
  Domain/
    Admin/AdminApiTokenService.php
    Properties/PropertySearchService.php
  Http/Controllers/
    Api/V1/
      Admin/
  Http/Middleware/AddSecurityHeaders.php
  Models/
  Support/CmsConfigService.php
database/
  migrations/
  factories/
  seeders/
frontend/
  src/app/                 # Next App Router
  src/components/
  src/features/
  src/generated/
  src/lib/
  public/                  # migrated template assets
routes/
  web.php                  # redirects frontend traffic to Next.js
  api.php                  # versioned API routes
```

## Local Setup

1. Backend setup (Laravel):
   ```bash
   composer install
   cp .env.example .env
   php artisan key:generate
   ```
2. Configure DB in `.env` (already set for your case):
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=realestate
   DB_USERNAME=root
   DB_PASSWORD=
   ```
3. Run migrations + seeders:
   ```bash
   php artisan migrate --seed
   ```
4. Frontend setup (Next.js):
   ```bash
   cd frontend
   npm install
   cp .env.example .env.local
   ```
5. Start the full stack (API + queue worker + Next frontend) with one command:
   ```bash
   composer dev
   ```
   This command auto-cleans stale local dev processes/locks for this project before starting.

If you want to run services in separate terminals:
```bash
composer dev:clean
composer dev:api
composer dev:queue
composer dev:frontend
```

If `next dev` still looks unstable on your machine, use the built frontend server instead:
```bash
npm --prefix frontend run build
composer dev:frontend:start
```

Use:
- Frontend: `http://127.0.0.1:3000`
- Admin dashboard: `http://127.0.0.1:3000/admin/login`
- API: `http://127.0.0.1:8000/api/v1/*`

The one-command dev runner pins Next.js to port `3000` and Laravel API to `8000`.

Seeded admin credentials:
- `admin@homerealestate.test`
- `admin12345`

## Production Deployment (One Command, No Docker)

Prerequisites on server:
- PHP 8.2+
- Composer
- Node.js + npm
- MySQL running and reachable by `.env.production`

1. Prepare production env file:
   ```bash
   cp .env.production.example .env.production
   ```
2. Set secure values in `.env.production`:
   - `APP_KEY` (required)
   - `DB_*` credentials
   - `APP_URL`, `FRONTEND_URL`, `NEXT_PUBLIC_SITE_URL`
   - key generation example:
     ```bash
     php -r "echo 'base64:'.base64_encode(random_bytes(32)).PHP_EOL;"
     ```
3. Start the full production stack with one command:
   ```bash
   composer prod:up
   ```

What `composer prod:up` does:
- Runs Laravel migrations with `--force` in production env
- Caches Laravel optimizations
- Builds Next.js production bundle
- Starts detached background services:
  - Laravel API (`php artisan serve --env=production --port=API_PORT`)
  - Laravel queue worker
  - Next.js server (`npm run start -- --port APP_PORT`)

Useful commands:
```bash
composer prod:status
composer prod:logs
composer prod:down
```

Production logs are written to:
- `storage/logs/production`

## Quality Checks

```bash
php artisan test
```

```bash
cd frontend
npm run typecheck
npm run build
```

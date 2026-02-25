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
   composer setup
   ```
   `composer setup` prepares `.env`, generates key, runs migrations/seeders, and installs frontend deps.
2. Configure DB in `.env` (already set for your case, only change if needed):
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=realestate
   DB_USERNAME=root
   DB_PASSWORD=
   ```
3. If you need to rerun setup parts separately:
   ```bash
   composer setup:backend
   composer setup:frontend
   ```

## Server Lifecycle Commands

Use these as the standard 4-command workflow.

### Development

```bash
# Start
composer serve:up

# Stop
composer serve:down

# Status
composer serve:status

# Restart
composer serve:restart
```

### Production

```bash
# Start
composer prod:up

# Stop
composer prod:down

# Status
composer prod:status

# Restart
composer prod:restart
```

Optional monitoring:
```bash
composer serve:logs
composer prod:logs
```

Other run modes (optional):

- Foreground (single terminal, one command):
  ```bash
  composer dev
  ```
- Foreground (separate terminals):
  ```bash
  composer dev:clean
  composer dev:api
  composer dev:queue
  composer dev:frontend
  ```

Detached per-service controls:
```bash
composer serve:api:start
composer serve:api:stop
composer serve:api:restart
composer serve:frontend:start
composer serve:frontend:stop
composer serve:frontend:restart
composer serve:queue:start
composer serve:queue:stop
composer serve:queue:restart
```

If `next dev` looks unstable on your machine, use the built frontend server:
```bash
npm --prefix frontend run build
composer dev:frontend:start
```

Long-running composer scripts (`dev:*`, `serve:logs`, Docker logs) have process timeout disabled, so they do not auto-stop at 300 seconds.

Use:
- Frontend: `http://127.0.0.1:3000`
- Unified login: `http://127.0.0.1:3000/login`
- Admin dashboard: `http://127.0.0.1:3000/admin/login`
- Agent portal: `http://127.0.0.1:3000/portal/agent`
- Customer portal: `http://127.0.0.1:3000/portal/customer`
- API: `http://127.0.0.1:8000/api/v1/*`

The default ports are pinned to API `8000` and frontend `3000`. Override with:
```env
DEV_API_PORT=8000
DEV_FRONTEND_PORT=3000
```

Seeded admin credentials:
- `admin@homerealestate.test`
- `admin12345`

Seeded portal credentials:
- Admin: `admin@homerealestate.test` / `admin12345` (redirects to `/admin`)
- Agent: `agent@homerealestate.test` / `agent12345` (redirects to `/portal/agent`)
- Customer: `customer@homerealestate.test` / `customer12345` (redirects to `/portal/customer`)

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

Lifecycle commands:
```bash
composer prod:up
composer prod:down
composer prod:status
composer prod:restart
```

Optional logs:
```bash
composer prod:logs
```

Production logs are written to:
- `storage/logs/production`

## Docker Deployment

Prerequisite:
- Docker + Docker Compose plugin

1. Prepare environment:
   ```bash
   cp .env.production.example .env.production
   ```
2. Set at minimum in `.env.production`:
   - `APP_KEY`
   - `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`
   - `DB_ROOT_PASSWORD` (required by MySQL container)
   - `APP_PORT` (public port, defaults to `80`)
3. Start everything:
   ```bash
   composer docker:up
   ```
4. Start backend or frontend groups independently (optional):
```bash
composer docker:up:backend
composer docker:up:frontend
```

Docker lifecycle commands:
```bash
composer docker:status
composer docker:logs
composer docker:restart
composer docker:down
```

## Quality Checks

```bash
php artisan test
```

```bash
cd frontend
npm run typecheck
npm run build
```

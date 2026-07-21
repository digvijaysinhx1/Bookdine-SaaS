# BookDine

BookDine is a full-stack restaurant booking application. The repository is organized as a monorepo with the existing Node.js/Express backend isolated under `backend/` and a prepared `frontend/` workspace for a future React + Vite application.

## Project Structure

```text
bookdine/
├── backend/
│   ├── src/
│   ├── package.json
│   ├── package-lock.json
│   ├── .env
│   └── test_db.js
├── frontend/
├── .gitignore
└── README.md
```

## Backend Setup

```bash
cd backend
npm install
```

Create a `backend/.env` file with the required backend environment variables. The existing `.env` file has been moved into `backend/.env`.

Run the backend in development mode:

```bash
npm run dev
```

Run the backend in production mode:

```bash
npm start
```

Test the database connection:

```bash
node test_db.js
```

## Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_BASE_URL=/api
```

Run the frontend in development mode:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

See `frontend/PHASE_1_TESTING.md` for Phase 1 frontend test cases.

## Environment Variables

Backend environment variables belong in:

```text
backend/.env
```

Required Supabase backend variables:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
JWT_SECRET
```

Optional Supabase backend variables:

```text
SUPABASE_ANON_KEY
SUPABASE_AUTH_ENABLED=true
SUPABASE_REALTIME_ENABLED=false
PORT
```

Frontend environment variables belong in:

```text
frontend/.env
```

Required frontend variables:

```text
VITE_API_BASE_URL=/api
```

Use `/api` with the Vite dev proxy. For production or preview without the proxy, point directly to the backend API, for example `http://localhost:3000/api`.

Optional backend variable for cross-origin frontend access:

```text
CORS_ORIGIN=http://localhost:5173
```

Do not commit `.env` files. They are ignored by the root `.gitignore`.

## Supabase Setup

Run the SQL in `backend/migrations/001_supabase_reservations_realtime.sql` after confirming the existing `reservations` table uses the current `tenant_id`, `date`, `time`, and `status` columns. This adds the active reservation slot uniqueness guard and enables Supabase Realtime for reservation changes.

## Development Commands

Backend commands:

```bash
cd backend
npm install
npm run dev
npm start
node test_db.js
```

Frontend commands:

```bash
cd frontend
npm install
npm run dev
npm run build
npm run preview
```

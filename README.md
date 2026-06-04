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

The `frontend/` directory is intentionally empty for now. It is prepared for a future React + Vite application.

When the frontend is added, install dependencies from inside the `frontend/` directory and keep frontend environment variables in `frontend/.env`.

## Environment Variables

Backend environment variables belong in:

```text
backend/.env
```

Frontend environment variables will belong in:

```text
frontend/.env
```

Do not commit `.env` files. They are ignored by the root `.gitignore`.

## Development Commands

Backend commands:

```bash
cd backend
npm install
npm run dev
npm start
node test_db.js
```

Frontend commands will be added after the React + Vite application is created.

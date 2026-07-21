# Bookdine Phase 1 Frontend Testing

Phase 1 frontend covers authentication UI, protected routing, dashboard layout shell, and API integration with the existing backend.

## Prerequisites

1. Backend running on port `3000`
2. Sample users prepared per `backend/PHASE_1_TESTING.md`
3. Frontend env file:

```text
frontend/.env
```

```env
VITE_API_BASE_URL=/api
```

## Start Applications

Terminal 1:

```powershell
cd D:\Bookdine\backend
npm run dev
```

Terminal 2:

```powershell
cd D:\Bookdine\frontend
npm run dev
```

Open:

```text
http://localhost:5173
```

## Login Tests

| Case | Steps | Expected |
|------|-------|----------|
| Valid credentials | Sign in with `owner@cafemocha.com` / `ChangeMe123!` | Redirect to `/dashboard` |
| Invalid credentials | Use wrong password | Error: invalid email or password |
| Empty fields | Submit blank form | Client validation errors |
| Invalid email | Enter `not-an-email` | Email validation error |
| Short password | Enter fewer than 8 characters | Password validation error |
| Inactive account | Sign in with inactive user | Account inactive message |
| Network failure | Stop backend, attempt login | Network error message |
| Remember me | Check Remember me, sign in, reopen browser tab | Session persists |
| Without remember me | Leave unchecked, close tab, reopen | Session cleared |

## Route Tests

| Case | Steps | Expected |
|------|-------|----------|
| Protected route | Visit `/dashboard` while logged out | Redirect to `/login` |
| Public route | Visit `/login` while logged in | Redirect to `/dashboard` |
| Logout | Click Logout in sidebar | Token cleared, redirect to login |
| Page refresh | Refresh on dashboard while authenticated | Stay authenticated |
| Expired token | Wait for token expiry or replace stored token with invalid value | Redirect to login with session message |
| Role access | Login as MANAGER or STAFF | Dashboard accessible |

## Manual Expired Token Test

1. Sign in successfully
2. Open DevTools → Application → Storage
3. Replace `bookdine_access_token` with an invalid value
4. Refresh the page
5. Expect redirect to login with a session error message

## Build Verification

```powershell
cd D:\Bookdine\frontend
npm run build
npm run preview
```

For preview mode without the Vite proxy, set:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

Ensure backend CORS allows the preview origin if different from `http://localhost:5173`.

## Phase 1 Frontend Scope

Implemented:

```text
Login page
Logout flow
Auth context and token storage
Protected and public routes
Role-aware route guard foundation
Dashboard layout shell
Reusable UI components
Auth API service layer
Loading and error states
```

Not implemented:

```text
Reservations
Tables
Settings
Widget
Booking page
Analytics
Super Admin
Subscription management
Placeholder future modules
```

# Bookdine Phase 1 Backend Testing

Phase 1 covers backend-only authentication, JWT authorization, role checks, tenant isolation, and production-style error responses.

Do not test frontend, Super Admin, reservations creation, tables, payments, subscriptions, or availability engine as part of Phase 1.

## Environment

Required backend environment file:

```text
backend/.env
```

Required values:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SECRET_KEY=your_supabase_service_role_key
JWT_SECRET=your_long_random_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_ISSUER=bookdine-api
JWT_AUDIENCE=bookdine-restaurant
PORT=3000
```

After changing `.env`, restart the backend.

```powershell
cd D:\Bookdine\backend
npm start
```

## Sample Database Preparation

The sample CSV users use lower-case roles and do not include passwords. Run this SQL once in Supabase SQL Editor.

```sql
alter table public.users
drop constraint if exists users_role_check;

alter table public.users
add column if not exists password text;

update public.users
set
  password = '$2b$10$7vv/r32Yv5cvYP4JawJKju0/Jx8NIdh.mLoovzvTJuApoi9RV/BpO',
  role = case lower(trim(role))
    when 'owner' then 'RESTAURANT_ADMIN'
    when 'admin' then 'RESTAURANT_ADMIN'
    when 'restaurant_admin' then 'RESTAURANT_ADMIN'
    when 'manager' then 'MANAGER'
    when 'staff' then 'STAFF'
    else role
  end;

update public.users
set role = 'STAFF'
where role not in ('RESTAURANT_ADMIN', 'MANAGER', 'STAFF')
   or role is null;

alter table public.users
add constraint users_role_check
check (role in ('RESTAURANT_ADMIN', 'MANAGER', 'STAFF'));
```

All test users use this password:

```text
ChangeMe123!
```

Verify users:

```sql
select id, tenant_id, name, email, role, is_active, length(password) as password_length
from public.users
order by id;
```

Expected password length is `60`.

## Postman Setup

Import:

```text
backend/postman/Bookdine_Phase1.postman_collection.json
```

Set collection variables:

```text
baseUrl = http://localhost:3000

adminEmail = owner@cafemocha.com
adminPassword = ChangeMe123!

managerEmail = manager@cafemocha.com
managerPassword = ChangeMe123!

staffEmail = staff1@cafemocha.com
staffPassword = ChangeMe123!

inactiveEmail = inactive@cafemocha.com
inactivePassword = ChangeMe123!

restaurantBTenantId = 2
```

## Test Order

Run requests one by one first. After all pass individually, use the Postman collection runner.

### Login

Run:

```text
LOGIN - Successful Login
```

Expected:

```text
200 OK
```

The response must include:

```json
{
  "success": true,
  "data": {
    "access_token": "...",
    "token_type": "Bearer"
  }
}
```

The Postman test script stores `data.access_token` as `accessToken`.

### Invalid Email

Run:

```text
LOGIN - Invalid Email
```

Expected:

```text
400 INVALID_EMAIL
```

### Invalid Password

Run:

```text
LOGIN - Invalid Password
```

Expected:

```text
401 INVALID_CREDENTIALS
```

### Inactive Account

Run:

```text
LOGIN - Inactive Account
```

Expected:

```text
403 ACCOUNT_INACTIVE
```

### Logout

Run after a successful login:

```text
LOGIN - Logout
```

Expected:

```text
200 OK
```

Logout is stateless in Phase 1. The client should discard the access token.

### Unauthorized Access

Run:

```text
AUTH - Unauthorized Access
```

Expected:

```text
401 TOKEN_REQUIRED
```

### Expired Token

Generate an expired token from the backend folder:

```powershell
cd D:\Bookdine\backend

node -e "import 'dotenv/config'; import jwt from 'jsonwebtoken'; const token=jwt.sign({sub:'1',user_id:1,tenant_id:1,role:'RESTAURANT_ADMIN',token_type:'access'}, process.env.JWT_SECRET, {expiresIn:'1ms',issuer:process.env.JWT_ISSUER || 'bookdine-api',audience:process.env.JWT_AUDIENCE || 'bookdine-restaurant'}); setTimeout(() => console.log(token), 10);"
```

Copy the printed token into the Postman collection variable:

```text
expiredToken
```

Run:

```text
TOKEN - Expired Token
```

Expected:

```text
401 TOKEN_EXPIRED
```

### Tenant Isolation

Run:

```text
TENANT - Restaurant A Attempts Restaurant B Data
```

The request uses a Restaurant A token and attempts to access:

```text
tenant_id = 2
```

Expected:

```text
403 TENANT_FORBIDDEN
```

### Role Access

Run:

```text
ROLE - RESTAURANT_ADMIN Access
ROLE - MANAGER Login
ROLE - MANAGER Access
ROLE - STAFF Login
ROLE - STAFF Access
```

Expected:

```text
RESTAURANT_ADMIN access: 200 OK
MANAGER login: 200 OK
MANAGER access: 200 OK
STAFF login: 200 OK
STAFF access: 200 OK
```

## Manual Request Examples

Login:

```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "owner@cafemocha.com",
  "password": "ChangeMe123!"
}
```

Protected request:

```http
GET http://localhost:3000/api/reservations
Authorization: Bearer YOUR_ACCESS_TOKEN
```

Cross-tenant request:

```http
GET http://localhost:3000/api/reservations?tenant_id=2
Authorization: Bearer RESTAURANT_A_ACCESS_TOKEN
```

Expected:

```text
403 TENANT_FORBIDDEN
```

## Troubleshooting

If login returns `INVALID_CREDENTIALS`, verify:

```sql
select id, tenant_id, email, role, is_active, length(password) as password_length
from public.users
where email = 'owner@cafemocha.com';
```

If protected requests return `INVALID_TOKEN`, log in again and use the new `data.access_token`. Old tokens become invalid after changing `JWT_SECRET`, `JWT_ISSUER`, or `JWT_AUDIENCE`.

If role access returns `500`, confirm the backend was restarted and the protected reservation read path matches the sample database columns.

## Phase 1 Scope

Implemented:

```text
POST /api/auth/login
POST /api/auth/logout
JWT access token validation
Role middleware
Tenant middleware
Centralized error responses
Postman tests
```

Not implemented in Phase 1:

```text
Frontend
Self-registration
Super Admin
Reservations module
Tables module
Availability engine
Payments
Subscriptions
```

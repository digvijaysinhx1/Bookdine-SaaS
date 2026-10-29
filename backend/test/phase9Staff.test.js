import test from "node:test";
import assert from "node:assert/strict";
import { ROLES } from "../src/config/roles.js";
import { listStaff, createStaff } from "../src/services/staff.service.js";
import { validateCreateStaff } from "../src/validators/staff.validator.js";
import tenantMiddleware from "../src/middlewares/tenant.middleware.js";

test("only owners may list staff", async () => {
  await assert.rejects(listStaff({ tenant_id: 1, role: ROLES.STAFF }), { code: "OWNER_REQUIRED" });
  await assert.rejects(listStaff({ tenant_id: 1, role: ROLES.MANAGER }), { code: "OWNER_REQUIRED" });
});

test("owners cannot create an owner account", async () => {
  await assert.rejects(createStaff({ tenant_id: 1, actor_role: ROLES.RESTAURANT_ADMIN, name: "Owner", email: "new@example.com", password: "long secure password", role: ROLES.RESTAURANT_ADMIN }), { code: "ROLE_ASSIGNMENT_FORBIDDEN" });
});

test("tenant middleware derives access from the authenticated user and rejects cross-tenant input", () => {
  let error;
  const req = { user: { tenant_id: 12 }, query: { tenant_id: "13" }, headers: {} };
  tenantMiddleware(req, {}, (nextError) => { error = nextError; });
  assert.equal(error?.code, "TENANT_FORBIDDEN");

  let nextCalled = false;
  const trustedReq = { user: { tenant_id: 12 }, body: { tenant_id: "12" }, headers: {} };
  tenantMiddleware(trustedReq, {}, (nextError) => { assert.equal(nextError, undefined); nextCalled = true; });
  assert.equal(nextCalled, true);
  assert.equal(trustedReq.tenant_id, 12);
});

test("staff validator accepts supported roles and rejects role escalation", () => {
  const invoke = (body) => new Promise((resolve) => validateCreateStaff({ body }, {}, (error) => resolve(error || null)));
  return Promise.all([
    invoke({ name: "Team Member", email: "team@example.com", password: "a secure password", role: ROLES.STAFF }).then((error) => assert.equal(error, null)),
    invoke({ name: "Team Member", email: "team@example.com", password: "a secure password", role: ROLES.RESTAURANT_ADMIN }).then((error) => assert.equal(error?.code, "INVALID_ROLE")),
    invoke({ name: "Team Member", email: "team@example.com", password: "short", role: ROLES.STAFF }).then((error) => assert.equal(error?.code, "INVALID_PASSWORD")),
  ]);
});

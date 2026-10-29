import test from "node:test";
import assert from "node:assert/strict";
import { createTenantSlugUpdater } from "../src/services/tenantSlugUpdater.js";

test("slug update is scoped to the authenticated tenant ID", async () => {
  const calls = [];
  const updateSlug = createTenantSlugUpdater(fakeDb({ data: { slug: "new-cafe" }, calls }));
  assert.deepEqual(await updateSlug({ tenantId: 41, slug: "new-cafe" }), "new-cafe");
  assert.deepEqual(calls, [
    ["from", "tenants"],
    ["update", { slug: "new-cafe" }],
    ["eq", "id", 41],
    ["select", "slug"],
    ["maybeSingle"],
  ]);
});

test("unique database violations return a slug conflict", async () => {
  const updateSlug = createTenantSlugUpdater(fakeDb({ error: { code: "23505", message: "tenants_slug_unique" } }));
  await assert.rejects(updateSlug({ tenantId: 41, slug: "taken-cafe" }), { statusCode: 409, code: "DUPLICATE_SLUG" });
});

test("slug update refuses missing tenant context", async () => {
  const updateSlug = createTenantSlugUpdater(fakeDb({ data: { slug: "cafe" } }));
  await assert.rejects(updateSlug({ slug: "cafe" }), { statusCode: 401, code: "TENANT_REQUIRED" });
});

function fakeDb(result) {
  const calls = result.calls || [];
  const chain = {
    from(table) { calls.push(["from", table]); return this; },
    update(body) { calls.push(["update", body]); return this; },
    eq(column, value) { calls.push(["eq", column, value]); return this; },
    select(columns) { calls.push(["select", columns]); return this; },
    maybeSingle() { calls.push(["maybeSingle"]); return Promise.resolve({ data: result.data || null, error: result.error || null }); },
  };
  return chain;
}

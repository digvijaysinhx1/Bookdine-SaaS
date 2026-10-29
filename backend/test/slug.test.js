import test from "node:test";
import assert from "node:assert/strict";
import { isValidSlug, normalizeRestaurantSlug, slugify } from "../src/utils/slug.js";
import { createTenantSlugResolver } from "../src/services/tenantSlugResolver.js";

test("slugify creates a URL-safe slug and falls back for punctuation-only names", () => {
  assert.equal(slugify("Café & Bistro!"), "cafe-bistro");
  assert.equal(slugify("  !!! "), "restaurant");
});

test("duplicate restaurant names share a base that can be uniquely suffixed", () => {
  const first = slugify("Blue Moon Cafe");
  const second = `${slugify("Blue Moon Cafe")}-a1b2c3d4`;
  assert.equal(first, "blue-moon-cafe");
  assert.notEqual(first, second);
  assert.ok(isValidSlug(second));
});

test("slug validation rejects malformed input before lookup", () => {
  assert.ok(isValidSlug("blue-moon-cafe"));
  for (const slug of ["", "Blue-Moon", "two words", "../other", "a--b"]) {
    assert.equal(isValidSlug(slug), false);
  }
});

test("restaurant slug input is normalized and full URLs are rejected", () => {
  assert.equal(normalizeRestaurantSlug(" Roasted Beans Café "), "roasted-beans-cafe");
  assert.equal(normalizeRestaurantSlug("HTTP://example.com/cafe"), null);
  assert.equal(normalizeRestaurantSlug("cafe.example.com"), null);
  assert.equal(normalizeRestaurantSlug(""), null);
});

test("unknown slugs return not found", async () => {
  const resolver = createTenantSlugResolver(fakeTenantDb(null));
  await assert.rejects(resolver("unknown-cafe"), { statusCode: 404, code: "RESTAURANT_NOT_FOUND" });
});

test("tenant resolution filters by the requested active slug", async () => {
  const calls = [];
  const tenant = { id: 23, slug: "north-cafe", name: "North Cafe", status: "active" };
  const resolver = createTenantSlugResolver(fakeTenantDb(tenant, calls));
  assert.equal((await resolver("north-cafe")).id, 23);
  assert.deepEqual(calls, [["tenants"], ["select", "id, slug, name, opening_time, closing_time, max_guest, status"], ["eq", "slug", "north-cafe"], ["eq", "status", "active"], ["maybeSingle"]]);
});

function fakeTenantDb(data, calls = []) {
  return {
    from(table) { calls.push([table]); return this; },
    select(columns) { calls.push(["select", columns]); return this; },
    eq(column, value) { calls.push(["eq", column, value]); return this; },
    maybeSingle() { calls.push(["maybeSingle"]); return Promise.resolve({ data, error: null }); },
  };
}

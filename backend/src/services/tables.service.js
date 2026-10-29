import { supabaseAdmin } from "../db/index.js";
import { conflict, HttpError } from "../utils/httpError.js";

const TABLE_COLUMNS = [
  "id",
  "table_number",
  "capacity",
  "status",
].join(", ");

const DB_TABLE = "tenant_tables";
const DEFAULT_LOCATION = "Indoor";

const toDbStatus = (table = {}) => {
  if (typeof table.is_active === "boolean") {
    return table.is_active ? "available" : "inactive";
  }

  const status = String(table.status || "").toLowerCase();

  if (status === "inactive") {
    return "inactive";
  }

  if (["available", "occupied", "reserved"].includes(status)) {
    return status;
  }

  return "available";
};

const toApiStatus = (status) => (status === "inactive" ? "Inactive" : "Active");

const normalizeTable = (table) => ({
  id: table.id,
  table_number: table.table_number,
  capacity: table.capacity,
  location: DEFAULT_LOCATION,
  is_active: table.status !== "inactive",
  status: toApiStatus(table.status),
});

const requireTenant = (tenant_id) => {
  if (!tenant_id) {
    throw new HttpError(
      401,
      "Authenticated user is missing tenant context",
      "TENANT_REQUIRED"
    );
  }
};

const notFound = () =>
  new HttpError(404, "Table was not found", "TABLE_NOT_FOUND");

const requireUser = (user_id) => {
  if (!user_id) {
    throw new HttpError(
      401,
      "Authenticated user is missing user context",
      "USER_REQUIRED"
    );
  }
};

const isDuplicateTableNumberError = (error) =>
  error?.code === "23505" ||
  error?.message?.toLowerCase().includes("uq_tenant_table_number") ||
  error?.message?.toLowerCase().includes("duplicate key");

const throwIfDuplicateTableNumber = async ({
  tenant_id,
  table_number,
  excludeId,
} = {}) => {
  if (!table_number) {
    return;
  }

  let query = supabaseAdmin
    .from(DB_TABLE)
    .select("id")
    .eq("tenant_id", tenant_id)
    .eq("table_number", table_number)
    .limit(1);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  if (data?.length) {
    throw conflict(
      "Table number already exists for this restaurant",
      "DUPLICATE_TABLE_NUMBER"
    );
  }
};

const getTableById = async ({ id, tenant_id }) => {
  const { data, error } = await supabaseAdmin
    .from(DB_TABLE)
    .select(TABLE_COLUMNS)
    .eq("id", id)
    .eq("tenant_id", tenant_id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw notFound();
  }

  return data;
};

export const getTables = async ({ tenant_id } = {}) => {
  requireTenant(tenant_id);

  const { data, error } = await supabaseAdmin
    .from(DB_TABLE)
    .select(TABLE_COLUMNS)
    .eq("tenant_id", tenant_id)
    .order("table_number", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data.map(normalizeTable);
};

export const createTable = async ({ tenant_id, user_id, table } = {}) => {
  requireTenant(tenant_id);
  requireUser(user_id);

  await throwIfDuplicateTableNumber({
    tenant_id,
    table_number: table.table_number,
  });

  const { data, error } = await supabaseAdmin
    .from(DB_TABLE)
    .insert({
      tenant_id,
      table_number: table.table_number,
      capacity: table.capacity,
      status: toDbStatus(table),
      created_by: user_id,
    })
    .select(TABLE_COLUMNS)
    .single();

  if (error) {
    if (isDuplicateTableNumberError(error)) {
      throw conflict(
        "Table number already exists for this restaurant",
        "DUPLICATE_TABLE_NUMBER"
      );
    }

    throw new Error(error.message);
  }

  return normalizeTable(data);
};

export const updateTable = async ({ id, tenant_id, table } = {}) => {
  requireTenant(tenant_id);

  if (table.table_number) {
    await throwIfDuplicateTableNumber({
      tenant_id,
      table_number: table.table_number,
      excludeId: id,
    });
  }

  const updatePayload = {
    ...(table.table_number ? { table_number: table.table_number } : {}),
    ...(table.capacity ? { capacity: table.capacity } : {}),
    ...(
      Object.prototype.hasOwnProperty.call(table, "status") ||
      Object.prototype.hasOwnProperty.call(table, "is_active")
        ? { status: toDbStatus(table) }
        : {}
    ),
  };

  if (!Object.keys(updatePayload).length) {
    return normalizeTable(await getTableById({ id, tenant_id }));
  }

  const { data, error } = await supabaseAdmin
    .from(DB_TABLE)
    .update(updatePayload)
    .eq("id", id)
    .eq("tenant_id", tenant_id)
    .select(TABLE_COLUMNS)
    .maybeSingle();

  if (error) {
    if (isDuplicateTableNumberError(error)) {
      throw conflict(
        "Table number already exists for this restaurant",
        "DUPLICATE_TABLE_NUMBER"
      );
    }

    throw new Error(error.message);
  }

  if (!data) {
    throw notFound();
  }

  return normalizeTable(data);
};

export const deleteTable = async ({ id, tenant_id } = {}) => {
  requireTenant(tenant_id);

  const { data, error } = await supabaseAdmin
    .from(DB_TABLE)
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenant_id)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw notFound();
  }

  return data;
};

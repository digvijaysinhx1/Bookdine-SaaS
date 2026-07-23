import { supabaseAdmin } from "../db/index.js";
import { conflict, HttpError } from "../utils/httpError.js";

const TABLE_COLUMNS = [
  "id",
  "table_number",
  "capacity",
  "location",
  "is_active",
].join(", ");

const normalizeTable = (table) => ({
  id: table.id,
  table_number: table.table_number,
  capacity: table.capacity,
  location: table.location,
  is_active: table.is_active,
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

const isDuplicateTableNumberError = (error) =>
  error?.code === "23505" ||
  error?.message?.toLowerCase().includes("cafe_tables_unique_table_number");

const throwIfDuplicateTableNumber = async ({
  tenant_id,
  table_number,
  excludeId,
} = {}) => {
  if (!table_number) {
    return;
  }

  let query = supabaseAdmin
    .from("cafe_tables")
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

export const getTables = async ({ tenant_id } = {}) => {
  requireTenant(tenant_id);

  const { data, error } = await supabaseAdmin
    .from("cafe_tables")
    .select(TABLE_COLUMNS)
    .eq("tenant_id", tenant_id)
    .order("table_number", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data.map(normalizeTable);
};

export const createTable = async ({ tenant_id, table } = {}) => {
  requireTenant(tenant_id);

  await throwIfDuplicateTableNumber({
    tenant_id,
    table_number: table.table_number,
  });

  const { data, error } = await supabaseAdmin
    .from("cafe_tables")
    .insert({
      tenant_id,
      table_number: table.table_number,
      capacity: table.capacity,
      location: table.location,
      is_active: table.is_active,
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

  const { data, error } = await supabaseAdmin
    .from("cafe_tables")
    .update(table)
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
    .from("cafe_tables")
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

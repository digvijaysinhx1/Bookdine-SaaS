import { forbidden, unauthorized } from "../utils/httpError.js";

const getRequestedTenantIds = (req) => {
  const tenantIds = [
    req.params?.tenant_id,
    req.params?.tenantId,
    req.query?.tenant_id,
    req.query?.tenantId,
    req.body?.tenant_id,
    req.body?.tenantId,
    req.headers["x-tenant-id"],
  ];

  return tenantIds.filter((tenantId) => tenantId != null && tenantId !== "");
};

export default (req, res, next) => {
  const userTenantId = req.user?.tenant_id;

  if (!userTenantId) {
    return next(unauthorized("Authenticated user is missing tenant context", "TENANT_REQUIRED"));
  }

  const requestedTenantIds = getRequestedTenantIds(req);
  const hasCrossTenantRequest = requestedTenantIds.some(
    (tenantId) => String(tenantId) !== String(userTenantId)
  );

  if (hasCrossTenantRequest) {
    return next(forbidden("Cross-tenant access is forbidden", "TENANT_FORBIDDEN"));
  }

  req.tenant_id = userTenantId;

  return next();
};

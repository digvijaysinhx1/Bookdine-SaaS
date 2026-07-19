export default (req, res, next) => {
  const tenantId = req.user?.tenant_id || req.headers["x-tenant-id"] || req.query.tenant_id;

  if (tenantId) {
    req.tenant_id = tenantId;
  }

  next();
};

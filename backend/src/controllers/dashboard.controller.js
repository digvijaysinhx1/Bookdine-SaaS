import { getDashboard } from "../services/dashboard.service.js";

export const getOverview = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, data: await getDashboard({ tenant_id: req.tenant_id }) });
  } catch (error) { next(error); }
};

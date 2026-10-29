import * as staffService from "../services/staff.service.js";

export const listStaff = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, data: await staffService.listStaff({ tenant_id: req.tenant_id, role: req.user.role }) });
  } catch (error) { next(error); }
};

export const createStaff = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const staff = await staffService.createStaff({ tenant_id: req.tenant_id, actor_role: req.user.role, name, email, password, role });
    res.status(201).json({ success: true, data: staff });
  } catch (error) { next(error); }
};

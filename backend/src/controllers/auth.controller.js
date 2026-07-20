import * as authService from "../services/auth.service.js";

export const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    const result = await authService.logout();
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

import * as settingsService from "../services/settings.service.js";

export const getSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.getSettings({
      tenant_id: req.tenant_id,
    });

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (err) {
    next(err);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.updateSettings({
      tenant_id: req.tenant_id,
      settings: req.body,
    });

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (err) {
    next(err);
  }
};

export const updateSlug = async (req, res, next) => {
  try {
    const result = await settingsService.updateSlug({
      tenant_id: req.tenant_id,
      slug: req.body.slug,
    });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

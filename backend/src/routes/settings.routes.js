import express from "express";
import * as settingsController from "../controllers/settings.controller.js";
import { validateUpdateSettingsRequest } from "../validators/settings.validator.js";

const router = express.Router();

router.get("/", settingsController.getSettings);
router.put("/", validateUpdateSettingsRequest, settingsController.updateSettings);

export default router;

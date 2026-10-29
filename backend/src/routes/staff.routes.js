import express from "express";
import * as staffController from "../controllers/staff.controller.js";
import { validateCreateStaff } from "../validators/staff.validator.js";

const router = express.Router();
router.get("/", staffController.listStaff);
router.post("/", validateCreateStaff, staffController.createStaff);
export default router;

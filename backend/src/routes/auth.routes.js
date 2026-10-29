import express from "express";
import * as authController from "../controllers/auth.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import {
  validateLoginRequest,
  validateRegisterRequest,
} from "../validators/auth.validator.js";

const router = express.Router();

router.post("/register", validateRegisterRequest, authController.register);
router.post("/login", validateLoginRequest, authController.login);
router.post("/logout", authMiddleware, authController.logout);

export default router;

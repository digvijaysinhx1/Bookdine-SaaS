import express from "express";
import * as tablesController from "../controllers/tables.controller.js";
import {
  validateCreateTableRequest,
  validateTableIdRequest,
  validateUpdateTableRequest,
} from "../validators/tables.validator.js";

const router = express.Router();

router.get("/", tablesController.getTables);
router.post("/", validateCreateTableRequest, tablesController.createTable);
router.put(
  "/:id",
  validateTableIdRequest,
  validateUpdateTableRequest,
  tablesController.updateTable
);
router.delete("/:id", validateTableIdRequest, tablesController.deleteTable);

export default router;

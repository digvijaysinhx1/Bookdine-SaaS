import * as tablesService from "../services/tables.service.js";

export const getTables = async (req, res, next) => {
  try {
    const tables = await tablesService.getTables({
      tenant_id: req.tenant_id,
    });

    res.status(200).json({
      success: true,
      data: tables,
    });
  } catch (err) {
    next(err);
  }
};

export const createTable = async (req, res, next) => {
  try {
    const table = await tablesService.createTable({
      tenant_id: req.tenant_id,
      table: req.body,
    });

    res.status(201).json({
      success: true,
      data: table,
    });
  } catch (err) {
    next(err);
  }
};

export const updateTable = async (req, res, next) => {
  try {
    const table = await tablesService.updateTable({
      id: req.params.id,
      tenant_id: req.tenant_id,
      table: req.body,
    });

    res.status(200).json({
      success: true,
      data: table,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteTable = async (req, res, next) => {
  try {
    await tablesService.deleteTable({
      id: req.params.id,
      tenant_id: req.tenant_id,
    });

    res.status(200).json({
      success: true,
      data: {
        id: req.params.id,
        deleted: true,
      },
    });
  } catch (err) {
    next(err);
  }
};

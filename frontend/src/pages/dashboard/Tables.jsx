import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth.js";
import { getTables, createTable, updateTable, deleteTable } from "../../services/tableService.js";
import Loader from "../../components/Loader.jsx";
import ErrorMessage from "../../components/ErrorMessage.jsx";
import Button from "../../components/Button.jsx";
import Input from "../../components/Input.jsx";

const Tables = () => {
  const { accessToken } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [tables, setTables] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    table_number: "",
    capacity: "",
    location: "Indoor",
    status: "Active",
  });
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    fetchTables();
  }, [accessToken]);

  const fetchTables = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getTables(accessToken);
      setTables(data);
    } catch (err) {
      setError(err.message || "Failed to load tables");
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.table_number.trim()) {
      errors.table_number = "Table number is required";
    }

    if (!formData.capacity || formData.capacity <= 0) {
      errors.capacity = "Capacity must be greater than 0";
    }

    if (!formData.location) {
      errors.location = "Location is required";
    }

    if (!formData.status) {
      errors.status = "Status is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const submissionData = {
        ...formData,
        capacity: parseInt(formData.capacity, 10),
      };

      if (editingTable) {
        await updateTable(accessToken, editingTable.id, submissionData);
        setSuccessMessage("Table updated successfully");
      } else {
        await createTable(accessToken, submissionData);
        setSuccessMessage("Table created successfully");
      }
      setShowModal(false);
      setEditingTable(null);
      setFormData({
        table_number: "",
        capacity: "",
        location: "Indoor",
        status: "Active",
      });
      await fetchTables();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.message || editingTable ? "Failed to update table" : "Failed to create table");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (table) => {
    setEditingTable(table);
    setFormData({
      table_number: table.table_number,
      capacity: table.capacity,
      location: table.location,
      status: table.status,
    });
    setShowModal(true);
    setValidationErrors({});
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await deleteTable(accessToken, deleteConfirm.id);
      setSuccessMessage("Table deleted successfully");
      setDeleteConfirm(null);
      await fetchTables();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.message || "Failed to delete table");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTable = () => {
    setEditingTable(null);
    setFormData({
      table_number: "",
      capacity: "",
      location: "Indoor",
      status: "Active",
    });
    setShowModal(true);
    setValidationErrors({});
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setValidationErrors((prev) => ({ ...prev, [field]: null }));
  };

  if (isLoading) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <Loader label="Loading tables..." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Tables</h1>
          <p className="mt-1 text-sm text-text-secondary">Manage your restaurant tables</p>
        </div>
        <Button onClick={handleAddTable}>+ Add Table</Button>
      </div>

      {error && <ErrorMessage message={error} className="mb-6" />}

      {successMessage && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      {tables.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-12 text-center">
          <p className="text-text-secondary">No tables found. Add your first table to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tables.map((table) => (
            <div
              key={table.id}
              className="rounded-lg border border-border bg-surface p-5 transition-shadow hover:shadow-md"
            >
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-text-primary">{table.table_number}</h3>
                <p className="text-sm text-text-secondary">{table.capacity} Seats</p>
              </div>
              <div className="mb-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Location:</span>
                  <span className="font-medium text-text-primary">{table.location}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Status:</span>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      table.status === "Active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {table.status}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleEdit(table)}
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  className="flex-1"
                  onClick={() => setDeleteConfirm(table)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6">
            <h2 className="mb-4 text-xl font-semibold text-text-primary">
              {editingTable ? "Edit Table" : "Add New Table"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Table Number"
                value={formData.table_number}
                onChange={(e) => handleChange("table_number", e.target.value)}
                error={validationErrors.table_number}
                placeholder="e.g., T1"
              />
              <Input
                label="Capacity"
                type="number"
                min="1"
                value={formData.capacity}
                onChange={(e) => handleChange("capacity", e.target.value)}
                error={validationErrors.capacity}
                placeholder="e.g., 4"
              />
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-text-primary">Location</label>
                <select
                  value={formData.location}
                  onChange={(e) => handleChange("location", e.target.value)}
                  className={`w-full rounded-lg border bg-surface px-3 py-2.5 text-sm text-text-primary transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${
                    validationErrors.location ? "border-danger" : "border-border"
                  }`}
                >
                  <option value="Indoor">Indoor</option>
                  <option value="Outdoor">Outdoor</option>
                  <option value="Private Room">Private Room</option>
                  <option value="Patio">Patio</option>
                </select>
                {validationErrors.location && (
                  <p className="text-xs text-danger">{validationErrors.location}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-text-primary">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange("status", e.target.value)}
                  className={`w-full rounded-lg border bg-surface px-3 py-2.5 text-sm text-text-primary transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${
                    validationErrors.status ? "border-danger" : "border-border"
                  }`}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                {validationErrors.status && (
                  <p className="text-xs text-danger">{validationErrors.status}</p>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowModal(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" isLoading={isSubmitting} disabled={isSubmitting}>
                  {editingTable ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-6">
            <h2 className="mb-2 text-xl font-semibold text-text-primary">Delete Table</h2>
            <p className="mb-6 text-sm text-text-secondary">
              Are you sure you want to delete {deleteConfirm.table_number}?
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setDeleteConfirm(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={handleDeleteConfirm}
                isLoading={isSubmitting}
                disabled={isSubmitting}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tables;

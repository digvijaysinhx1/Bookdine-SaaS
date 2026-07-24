import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth.js";
import {
  getReservations,
  createReservation,
  updateReservationStatus,
  cancelReservation,
} from "../../services/reservationService.js";
import Loader from "../../components/Loader.jsx";
import ErrorMessage from "../../components/ErrorMessage.jsx";
import Button from "../../components/Button.jsx";
import ReservationCard from "../../components/ReservationCard.jsx";
import ReservationFilters from "../../components/ReservationFilters.jsx";
import ReservationForm from "../../components/ReservationForm.jsx";
import LoadingReservations from "../../components/LoadingReservations.jsx";
import NoReservations from "../../components/NoReservations.jsx";

const Reservations = () => {
  const { accessToken } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchReservations();
  }, [accessToken, selectedFilter]);

  const fetchReservations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const filters = selectedFilter ? { status: selectedFilter } : {};
      const data = await getReservations(accessToken, filters);
      setReservations(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load reservations");
      setReservations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateReservation = async (reservationData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await createReservation(accessToken, reservationData);
      setSuccessMessage("Reservation created successfully");
      setShowCreateModal(false);
      await fetchReservations();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.message || "Failed to create reservation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    setError(null);

    try {
      await updateReservationStatus(accessToken, id, newStatus);
      setSuccessMessage(`Reservation marked as ${newStatus.toLowerCase()}`);
      await fetchReservations();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.message || "Failed to update reservation status");
    }
  };

  const handleCancelReservation = async (id) => {
    setError(null);

    try {
      await cancelReservation(accessToken, id);
      setSuccessMessage("Reservation cancelled successfully");
      await fetchReservations();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.message || "Failed to cancel reservation");
    }
  };

  const getFilterLabel = () => {
    const labels = {
      "": "All Reservations",
      confirmed: "confirmed",
      seated: "seated",
      completed: "completed",
      cancelled: "cancelled",
      no_show: "no_show",
    };
    return labels[selectedFilter] || "All Reservations";
  };

  if (isLoading) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <Loader label="Loading reservations..." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Reservations</h1>
          <p className="mt-1 text-sm text-text-secondary">Manage your restaurant reservations</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>+ Create Reservation</Button>
      </div>

      {error && <ErrorMessage message={error} className="mb-6" />}

      {successMessage && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      <div className="mb-6">
        <ReservationFilters
          selectedFilter={selectedFilter}
          onFilterChange={setSelectedFilter}
        />
      </div>

      {isLoading ? (
        <LoadingReservations />
      ) : reservations.length === 0 ? (
        <NoReservations filter={getFilterLabel()} />
      ) : (
        <div className="space-y-4">
          {reservations.map((reservation) => (
            <ReservationCard
              key={reservation.id}
              reservation={reservation}
              onStatusChange={handleStatusChange}
              onCancel={handleCancelReservation}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-lg border border-border bg-surface p-6 my-8">
            <h2 className="mb-4 text-xl font-semibold text-text-primary">
              Create New Reservation
            </h2>
            <ReservationForm
              onSubmit={handleCreateReservation}
              onCancel={() => setShowCreateModal(false)}
              isLoading={isSubmitting}
              token={accessToken}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Reservations;

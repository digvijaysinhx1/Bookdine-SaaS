import { useState, useEffect, useCallback } from "react";
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
  const [filters, setFilters] = useState({ status: "", date: "", source: "", search: "" });
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchReservations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getReservations(accessToken, { ...filters, page, page_size: 50 });
      setReservations(Array.isArray(data) ? data : []);
      setHasMore(Array.isArray(data) && data.length === 50);
    } catch (err) {
      setError(err.message || "Failed to load reservations");
      setReservations([]);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, filters, page]);

  useEffect(() => { fetchReservations(); }, [fetchReservations]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1);
      setFilters((current) => current.search === searchInput ? current : { ...current, search: searchInput });
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

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

  const updateFilter = (key, value) => {
    setPage(1);
    if (key === "search") {
      setSearchInput(value);
      return;
    }
    setFilters((current) => ({ ...current, [key]: value }));
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

      <div className="mb-6"><ReservationFilters filters={{ ...filters, search: searchInput }} onFilterChange={updateFilter} /></div>

      {isLoading ? (
        <LoadingReservations />
      ) : error ? (
        <div className="rounded-lg border border-border bg-surface p-8 text-center"><p className="mb-4 text-sm text-text-secondary">Reservations could not be loaded.</p><Button variant="secondary" onClick={fetchReservations}>Try again</Button></div>
      ) : reservations.length === 0 ? (
        <NoReservations filter={filters.status ? filters.status.toLowerCase().replace("_", " ") : "matching"} />
      ) : (
        <div className="space-y-4">
          {reservations.map((reservation) => <ReservationCard key={reservation.id} reservation={reservation} onStatusChange={handleStatusChange} onCancel={handleCancelReservation} />)}
          <div className="flex items-center justify-between pt-2"><span className="text-sm text-text-secondary">Page {page}</span><div className="flex gap-2"><Button variant="secondary" size="sm" disabled={page <= 1 || isLoading} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</Button><Button variant="secondary" size="sm" disabled={!hasMore || isLoading} onClick={() => setPage((current) => current + 1)}>Next</Button></div></div>
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

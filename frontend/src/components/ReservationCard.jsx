import { useState } from "react";
import Button from "./Button.jsx";
import ReservationStatusBadge from "./ReservationStatusBadge.jsx";

const ReservationCard = ({ reservation, onStatusChange, onCancel }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const status = String(reservation.status || "").toLowerCase();

  const formatTime = (timeString) => {
    try {
      const time = String(timeString || "").includes("T")
        ? String(timeString).slice(11, 16)
        : String(timeString || "").slice(0, 5);
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return timeString;
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const canChangeStatus = (currentStatus, newStatus) => {
    const validTransitions = {
      confirmed: ['seated', 'no_show', 'cancelled'],
      seated: ['completed'],
    };
    return validTransitions[String(currentStatus || "").toLowerCase()]?.includes(newStatus) || false;
  };

  const handleStatusChange = async (newStatus) => {
    if (!canChangeStatus(reservation.status, newStatus)) return;
    
    setIsUpdating(true);
    try {
      await onStatusChange(reservation.id, newStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (status !== 'confirmed') return;
    
    setIsUpdating(true);
    try {
      await onCancel(reservation.id);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-surface p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-text-primary">
              {reservation.guest_name}
            </h3>
            <ReservationStatusBadge status={reservation.status} />
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <div>
              <span className="text-text-secondary">Phone:</span>
              <span className="ml-1 text-text-primary">{reservation.phone_number}</span>
            </div>
            <div>
              <span className="text-text-secondary">Guests:</span>
              <span className="ml-1 text-text-primary">{reservation.guests}</span>
            </div>
            <div>
              <span className="text-text-secondary">Table:</span>
              <span className="ml-1 text-text-primary">{reservation.table_number || "Unassigned"}</span>
            </div>
            <div>
              <span className="text-text-secondary">Date:</span>
              <span className="ml-1 text-text-primary">{formatDate(reservation.date)}</span>
            </div>
            <div>
              <span className="text-text-secondary">Time:</span>
              <span className="ml-1 text-text-primary">{formatTime(reservation.slot)}</span>
            </div>
            <div>
              <span className="text-text-secondary">Source:</span>
              <span className="ml-1 text-text-primary">{{ online: "Online", walk_in: "Walk in" }[reservation.source] || reservation.source}</span>
            </div>
          </div>

          {reservation.special_notes ? (
            <div className="text-sm">
              <span className="text-text-secondary">Notes:</span>
              <p className="mt-1 text-text-primary">{reservation.special_notes}</p>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 sm:min-w-35">
          {status === 'confirmed' && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleStatusChange('seated')}
                disabled={isUpdating}
                className="w-full"
              >
                Mark Seated
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleStatusChange('no_show')}
                disabled={isUpdating}
                className="w-full"
              >
                No Show
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleCancel}
                disabled={isUpdating}
                className="w-full"
              >
                Cancel
              </Button>
            </>
          )}

          {status === 'seated' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleStatusChange('completed')}
              disabled={isUpdating}
              className="w-full"
            >
              Mark Completed
            </Button>
          )}

          {status === 'completed' && (
            <div className="text-sm text-text-secondary text-center py-2">
              Reservation completed
            </div>
          )}

          {status === 'cancelled' && (
            <div className="text-sm text-text-secondary text-center py-2">
              Reservation cancelled
            </div>
          )}

          {status === 'no_show' && (
            <div className="text-sm text-text-secondary text-center py-2">
              No show recorded
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReservationCard;

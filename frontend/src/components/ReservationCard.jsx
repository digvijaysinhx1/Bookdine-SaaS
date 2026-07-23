import { useState } from "react";
import Button from "./Button.jsx";
import ReservationStatusBadge from "./ReservationStatusBadge.jsx";

const ReservationCard = ({ reservation, onStatusChange, onCancel }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const formatTime = (timeString) => {
    try {
      const [hours, minutes] = timeString.split(':');
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
      CONFIRMED: ['SEATED', 'NO_SHOW', 'CANCELLED'],
      SEATED: ['COMPLETED'],
    };
    return validTransitions[currentStatus]?.includes(newStatus) || false;
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
    if (reservation.status !== 'CONFIRMED') return;
    
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
              <span className="text-text-secondary">Date:</span>
              <span className="ml-1 text-text-primary">{formatDate(reservation.date)}</span>
            </div>
            <div>
              <span className="text-text-secondary">Time:</span>
              <span className="ml-1 text-text-primary">{formatTime(reservation.slot)}</span>
            </div>
            <div>
              <span className="text-text-secondary">Source:</span>
              <span className="ml-1 text-text-primary">{reservation.source}</span>
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
          {reservation.status === 'CONFIRMED' && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleStatusChange('SEATED')}
                disabled={isUpdating}
                className="w-full"
              >
                Mark Seated
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleStatusChange('NO_SHOW')}
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

          {reservation.status === 'SEATED' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleStatusChange('COMPLETED')}
              disabled={isUpdating}
              className="w-full"
            >
              Mark Completed
            </Button>
          )}

          {reservation.status === 'COMPLETED' && (
            <div className="text-sm text-text-secondary text-center py-2">
              Reservation completed
            </div>
          )}

          {reservation.status === 'CANCELLED' && (
            <div className="text-sm text-text-secondary text-center py-2">
              Reservation cancelled
            </div>
          )}

          {reservation.status === 'NO_SHOW' && (
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

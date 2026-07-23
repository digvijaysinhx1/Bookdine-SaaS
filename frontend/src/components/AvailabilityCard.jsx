import SlotSelector from "./SlotSelector.jsx";
import GuestSelector from "./GuestSelector.jsx";

const AvailabilityCard = ({
  date,
  guests,
  onDateChange,
  onGuestsChange,
  slots,
  selectedSlot,
  onSlotSelect,
  loading,
  error,
  className = "",
}) => {
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className={`bg-surface rounded-xl border border-border p-6 space-y-6 ${className}`}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full rounded-lg border bg-surface px-3 py-2.5 text-sm text-text-primary transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 border-border"
            aria-label="Select date"
          />
          {date && (
            <p className="text-sm text-text-secondary mt-1.5">
              {formatDate(date)}
            </p>
          )}
        </div>

        <GuestSelector
          value={guests}
          onChange={onGuestsChange}
          min={1}
          max={20}
          label="Number of Guests"
        />
      </div>

      {error && (
        <div className="rounded-lg bg-danger/10 border border-danger/20 p-4">
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-text-primary">
          Available Time Slots
        </h3>
        <SlotSelector
          slots={slots}
          selectedSlot={selectedSlot}
          onSlotSelect={onSlotSelect}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default AvailabilityCard;

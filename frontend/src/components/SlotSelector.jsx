const SlotSelector = ({ 
  slots, 
  selectedSlot, 
  onSlotSelect, 
  className = "",
  loading = false,
}) => {
  if (loading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="h-12 rounded-lg bg-surface-muted animate-pulse"
              aria-hidden="true"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!slots || slots.length === 0) {
    return null;
  }

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

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {slots.map((slot) => {
          const isAvailable = slot.available ?? slot.is_available;
          const isSelected = selectedSlot === slot.time;

          return (
            <button
              key={slot.time}
              type="button"
              onClick={() => isAvailable && onSlotSelect(slot.time)}
              disabled={!isAvailable}
              className={`
                h-12 rounded-lg text-sm font-medium transition-all
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2
                ${
                  isAvailable
                    ? 'bg-white text-text-primary border-2 border-border hover:border-brand-500 hover:shadow-sm cursor-pointer'
                    : 'bg-surface-muted text-text-secondary/50 cursor-not-allowed border-2 border-transparent'
                }
                ${
                  isSelected && isAvailable
                    ? 'border-brand-600 bg-brand-50 text-brand-700 ring-2 ring-brand-500 ring-offset-2'
                    : ''
                }
              `}
              aria-label={`${formatTime(slot.time)} ${isAvailable ? 'available' : 'full'}`}
              aria-pressed={isSelected}
              aria-disabled={!isAvailable}
            >
              {formatTime(slot.time)}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SlotSelector;

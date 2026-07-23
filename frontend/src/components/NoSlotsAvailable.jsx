const NoSlotsAvailable = ({ 
  date, 
  guests, 
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
    <div className={`bg-surface-muted rounded-xl border border-border p-6 ${className}`}>
      <div className="flex items-start gap-4">
        <div className="shrink-0 text-text-secondary">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-medium text-text-primary mb-1">
            No Slots Available
          </h3>
          <p className="text-sm text-text-secondary">
            {date && guests
              ? `No slots available for ${guests} guest${guests > 1 ? 's' : ''} on ${formatDate(date)}.`
              : date
              ? `No slots available on ${formatDate(date)}.`
              : "No slots available for this date."}
          </p>
          <p className="text-sm text-text-secondary mt-2">
            Please try a different date or adjust the number of guests.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NoSlotsAvailable;

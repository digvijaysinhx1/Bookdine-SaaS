const ClosedDayCard = ({ 
  type = "restaurant", 
  date, 
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

  const messages = {
    restaurant: {
      title: "Restaurant Closed",
      description: date 
        ? `The restaurant is closed on ${formatDate(date)}.`
        : "The restaurant is closed on this day.",
      icon: (
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
      ),
    },
    reservations: {
      title: "Reservations Unavailable",
      description: date
        ? `Reservations are not available on ${formatDate(date)}.`
        : "Reservations are not available on this day.",
      icon: (
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
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
    },
  };

  const message = messages[type] || messages.restaurant;

  return (
    <div className={`bg-surface-muted rounded-xl border border-border p-6 ${className}`}>
      <div className="flex items-start gap-4">
        <div className="shrink-0 text-text-secondary">
          {message.icon}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-medium text-text-primary mb-1">
            {message.title}
          </h3>
          <p className="text-sm text-text-secondary">
            {message.description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClosedDayCard;

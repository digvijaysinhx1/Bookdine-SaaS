const LoadingSlots = ({ className = "" }) => {
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
      <div className="flex items-center justify-center py-4">
        <div className="flex items-center gap-2 text-text-secondary">
          <svg
            className="w-5 h-5 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-sm">Loading available slots...</span>
        </div>
      </div>
    </div>
  );
};

export default LoadingSlots;

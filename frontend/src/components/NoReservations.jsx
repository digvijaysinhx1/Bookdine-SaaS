const NoReservations = ({ filter = "All Reservations" }) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface-muted/30 py-12 px-4">
      <svg
        className="h-16 w-16 text-text-secondary/40"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      <h3 className="mt-4 text-lg font-medium text-text-primary">
        No reservations found
      </h3>
      <p className="mt-2 text-sm text-text-secondary">
        {filter === "All Reservations"
          ? "You don't have any reservations yet. Create your first reservation to get started."
          : `No ${filter.toLowerCase()} reservations found.`}
      </p>
    </div>
  );
};

export default NoReservations;

const ReservationFilters = ({ selectedFilter, onFilterChange }) => {
  const filters = [
    { value: "", label: "All Reservations" },
    { value: "CONFIRMED", label: "Confirmed" },
    { value: "SEATED", label: "Seated" },
    { value: "COMPLETED", label: "Completed" },
    { value: "CANCELLED", label: "Cancelled" },
    { value: "NO_SHOW", label: "No Show" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <button
          key={filter.value}
          type="button"
          onClick={() => onFilterChange(filter.value)}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            selectedFilter === filter.value
              ? "bg-brand-600 text-white"
              : "bg-surface text-text-secondary hover:bg-surface-muted hover:text-text-primary"
          }`}
          aria-pressed={selectedFilter === filter.value}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
};

export default ReservationFilters;

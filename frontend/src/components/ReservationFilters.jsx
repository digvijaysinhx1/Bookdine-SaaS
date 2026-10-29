const ReservationFilters = ({ filters, onFilterChange }) => (
  <div className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2 xl:grid-cols-4">
    <label className="text-xs font-medium text-text-secondary">Search guest, phone, email or booking ID
      <input value={filters.search} onChange={(event) => onFilterChange("search", event.target.value)} placeholder="Search reservations" className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-primary" />
    </label>
    <label className="text-xs font-medium text-text-secondary">Date
      <input type="date" value={filters.date} onChange={(event) => onFilterChange("date", event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-primary" />
    </label>
    <label className="text-xs font-medium text-text-secondary">Status
      <select value={filters.status} onChange={(event) => onFilterChange("status", event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-primary">
        <option value="">All statuses</option><option value="PENDING">Pending</option><option value="CONFIRMED">Confirmed</option><option value="SEATED">Seated</option><option value="COMPLETED">Completed</option><option value="CANCELLED">Cancelled</option><option value="NO_SHOW">No show</option>
      </select>
    </label>
    <label className="text-xs font-medium text-text-secondary">Booking source
      <select value={filters.source} onChange={(event) => onFilterChange("source", event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-primary">
        <option value="">All sources</option><option value="online">Online</option><option value="walk_in">Walk in</option>
      </select>
    </label>
  </div>
);

export default ReservationFilters;

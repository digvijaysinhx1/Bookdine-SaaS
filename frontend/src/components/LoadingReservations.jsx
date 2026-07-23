const LoadingReservations = () => {
  return (
    <div className="space-y-4">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-border bg-surface p-4 shadow-sm"
          aria-hidden="true"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-5 w-32 rounded bg-surface-muted animate-pulse" />
                <div className="h-6 w-20 rounded-full bg-surface-muted animate-pulse" />
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <div className="h-4 w-24 rounded bg-surface-muted animate-pulse" />
                <div className="h-4 w-16 rounded bg-surface-muted animate-pulse" />
                <div className="h-4 w-28 rounded bg-surface-muted animate-pulse" />
                <div className="h-4 w-20 rounded bg-surface-muted animate-pulse" />
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:min-w-35">
              <div className="h-9 w-full rounded-lg bg-surface-muted animate-pulse" />
              <div className="h-9 w-full rounded-lg bg-surface-muted animate-pulse" />
              <div className="h-9 w-full rounded-lg bg-surface-muted animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LoadingReservations;

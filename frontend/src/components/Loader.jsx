const Loader = ({ label = "Loading...", size = "md" }) => {
  const sizeClasses = {
    sm: "h-5 w-5",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };

  return (
    <div className="flex flex-col items-center gap-3" role="status" aria-live="polite">
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-brand-600 border-t-transparent`}
        aria-hidden="true"
      />
      {label ? <p className="text-sm text-text-secondary">{label}</p> : null}
      <span className="sr-only">{label}</span>
    </div>
  );
};

export default Loader;

const Input = ({
  id,
  label,
  type = "text",
  error,
  hint,
  endAdornment,
  className = "",
  ...props
}) => {
  const inputId = id || props.name;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label ? (
        <label htmlFor={inputId} className="block text-sm font-medium text-text-primary">
          {label}
        </label>
      ) : null}

      <div className="relative">
        <input
          id={inputId}
          type={type}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
          }
          className={`w-full rounded-lg border bg-surface px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/70 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${
            error ? "border-danger" : "border-border"
          } ${endAdornment ? "pr-11" : ""}`}
          {...props}
        />

        {endAdornment ? (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {endAdornment}
          </div>
        ) : null}
      </div>

      {hint && !error ? (
        <p id={`${inputId}-hint`} className="text-xs text-text-secondary">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p id={`${inputId}-error`} className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
};

export default Input;

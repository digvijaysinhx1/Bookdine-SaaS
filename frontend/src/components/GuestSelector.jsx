import { useState } from "react";

const GuestSelector = ({ 
  value, 
  onChange, 
  min = 1, 
  max = 20, 
  label = "Number of Guests",
  className = "",
  error,
}) => {
  const [inputValue, setInputValue] = useState(value || min);

  const handleIncrement = () => {
    const newValue = Math.min(inputValue + 1, max);
    setInputValue(newValue);
    onChange(newValue);
  };

  const handleDecrement = () => {
    const newValue = Math.max(inputValue - 1, min);
    setInputValue(newValue);
    onChange(newValue);
  };

  const handleInputChange = (e) => {
    const newValue = parseInt(e.target.value) || min;
    const clampedValue = Math.min(Math.max(newValue, min), max);
    setInputValue(clampedValue);
    onChange(clampedValue);
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-text-primary">
          {label}
        </label>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={inputValue <= min}
          className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-border bg-surface text-text-primary hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          aria-label="Decrease guests"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 12H4"
            />
          </svg>
        </button>

        <input
          type="number"
          value={inputValue}
          onChange={handleInputChange}
          min={min}
          max={max}
          className="w-20 text-center rounded-lg border bg-surface px-3 py-2.5 text-sm text-text-primary transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 border-border"
          aria-label="Number of guests"
          aria-invalid={Boolean(error)}
        />

        <button
          type="button"
          onClick={handleIncrement}
          disabled={inputValue >= max}
          className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-border bg-surface text-text-primary hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          aria-label="Increase guests"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>

        <span className="text-sm text-text-secondary ml-2">
          {inputValue === 1 ? "guest" : "guests"}
        </span>
      </div>

      {error ? (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
};

export default GuestSelector;

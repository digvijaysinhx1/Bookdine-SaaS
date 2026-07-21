const ErrorMessage = ({ title = "Something went wrong", message, className = "" }) => {
  if (!message) {
    return null;
  }

  return (
    <div
      className={`rounded-lg border border-red-200 bg-danger-muted px-4 py-3 text-sm text-red-700 ${className}`}
      role="alert"
    >
      {title ? <p className="font-medium">{title}</p> : null}
      <p className={title ? "mt-1" : ""}>{message}</p>
    </div>
  );
};

export default ErrorMessage;

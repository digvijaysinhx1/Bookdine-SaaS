const ReservationStatusBadge = ({ status }) => {
  const statusConfig = {
    PENDING: {
      bgColor: "bg-amber-100",
      textColor: "text-amber-700",
      label: "Pending",
    },
    CONFIRMED: {
      bgColor: "bg-blue-100",
      textColor: "text-blue-700",
      label: "Confirmed",
    },
    SEATED: {
      bgColor: "bg-purple-100",
      textColor: "text-purple-700",
      label: "Seated",
    },
    COMPLETED: {
      bgColor: "bg-green-100",
      textColor: "text-green-700",
      label: "Completed",
    },
    NO_SHOW: {
      bgColor: "bg-orange-100",
      textColor: "text-orange-700",
      label: "No Show",
    },
    CANCELLED: {
      bgColor: "bg-red-100",
      textColor: "text-red-700",
      label: "Cancelled",
    },
  };

  const normalizedStatus = String(status || "").toUpperCase();
  const config = statusConfig[normalizedStatus] || statusConfig.CONFIRMED;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.bgColor} ${config.textColor}`}
    >
      {config.label}
    </span>
  );
};

export default ReservationStatusBadge;

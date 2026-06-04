export const createReservation = async (cust) => {
  if (
    !cust.name ||
    !cust.date ||
    !cust.time ||
    !cust.phone ||
    cust.guests == null
  ) {
    throw new Error("All fields are required");
  }

  return {
    id: Date.now(),
    name: cust.name,
    date: cust.date,
    time: cust.time,
    phone: cust.phone,
    guests: cust.guests || 1,
    status: "CONFIRMED",
  };
};

export const getReservation = async () => {
  return [
    {
      id: 1,
      name: "digvijay",
      date: "2026-01-02",
      time: "20:00",
      phone: "9898566875",
      guests: 2,
      status: "CONFIRMED",
    },
  ];
};
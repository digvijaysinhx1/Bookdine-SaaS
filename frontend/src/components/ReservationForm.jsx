import { useState, useEffect, useRef } from "react";
import Button from "./Button.jsx";
import Input from "./Input.jsx";
import SlotSelector from "./SlotSelector.jsx";
import { getTimeSlots } from "../services/availabilityService.js";

const RESERVATION_SOURCES = [
  "Widget",
  "Walk In",
  "Calls",
  "Whatsapp",
  "Instagram",
  "Google Maps",
  "Zomato",
  "Custom Source",
];

const ReservationForm = ({ onSubmit, onCancel, isLoading, token }) => {
  const today = new Date().toISOString().split('T')[0];
  
  const [formData, setFormData] = useState({
    guest_name: "",
    phone_number: "",
    email: "",
    guests: "2",
    date: today,
    slot: "",
    source: "Walk In",
    special_notes: "",
  });

  const [errors, setErrors] = useState({});
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState("");
  const slotRequestId = useRef(0);

  useEffect(() => {
    if (formData.date && formData.guests && parseInt(formData.guests) > 0) {
      fetchSlots(formData.date, formData.guests);
    }
  }, [formData.date, formData.guests, token]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.guest_name.trim()) {
      newErrors.guest_name = "Guest name is required";
    }

    if (!formData.phone_number.trim()) {
      newErrors.phone_number = "Phone number is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }

    if (!formData.guests || parseInt(formData.guests) <= 0) {
      newErrors.guests = "Number of guests must be greater than 0";
    }

    if (!formData.date) {
      newErrors.date = "Date is required";
    }

    if (!formData.slot) {
      newErrors.slot = "Please select a time slot";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleDateOrGuestsChange = async (e) => {
    const { name, value } = e.target;
    const updatedFormData = { ...formData, [name]: value, slot: "" };
    setFormData(updatedFormData);
    setSlots([]);
    setSlotError("");

    if (name === "date" && errors.date) {
      setErrors((prev) => ({ ...prev, date: "" }));
    }
    if (name === "guests" && errors.guests) {
      setErrors((prev) => ({ ...prev, guests: "" }));
    }

  };

  const fetchSlots = async (date, guests) => {
    const requestId = slotRequestId.current + 1;
    slotRequestId.current = requestId;
    setLoadingSlots(true);
    setSlotError("");
    
    try {
      const availability = await getTimeSlots(token, { date, guests });
      if (requestId !== slotRequestId.current) return;
      
      if (availability && availability.slots && availability.slots.length > 0) {
        setSlots(availability.slots);
      } else if (availability && availability.message) {
        setSlots([]);
        setSlotError(availability.message);
      } else {
        setSlots([]);
        setSlotError("No available slots for this date and guest count");
      }
    } catch (error) {
      if (requestId !== slotRequestId.current) return;
      setSlots([]);
      const errorMessage = error.message || "Failed to load available slots";
      
      if (errorMessage.toLowerCase().includes("closed")) {
        setSlotError("Restaurant is closed on this date");
      } else if (errorMessage.toLowerCase().includes("unavailable")) {
        setSlotError("Reservations are unavailable for this date");
      } else {
        setSlotError("Failed to load available slots. Please try again.");
      }
    } finally {
      if (requestId === slotRequestId.current) {
        setLoadingSlots(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const submissionData = {
      guest_name: formData.guest_name.trim(),
      phone_number: formData.phone_number.trim(),
      email: formData.email.trim().toLowerCase(),
      guests: parseInt(formData.guests),
      date: formData.date,
      slot: formData.slot,
      source: formData.source,
      special_notes: formData.special_notes.trim() || null,
    };

    await onSubmit(submissionData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          name="date"
          label="Date"
          type="date"
          min={today}
          value={formData.date}
          onChange={handleDateOrGuestsChange}
          error={errors.date}
          required
        />

        <Input
          name="guests"
          label="Number of Guests"
          type="number"
          min="1"
          value={formData.guests}
          onChange={handleDateOrGuestsChange}
          error={errors.guests}
          placeholder="Enter number of guests"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">
          Available Slots *
        </label>
        {loadingSlots ? (
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Loading available slots...
          </div>
        ) : slotError ? (
          <div className="rounded-lg border border-danger/20 bg-danger/5 p-4">
            <p className="text-sm text-danger">{slotError}</p>
          </div>
        ) : slots.length > 0 ? (
          <SlotSelector
            slots={slots}
            selectedSlot={formData.slot}
            onSlotSelect={(slot) => {
              setFormData((prev) => ({ ...prev, slot }));
              if (errors.slot) {
                setErrors((prev) => ({ ...prev, slot: "" }));
              }
            }}
          />
        ) : (
          <div className="rounded-lg border border-border bg-surface-muted/30 p-4">
            <p className="text-sm text-text-secondary">
              No available slots for the selected date and guest count.
            </p>
          </div>
        )}
        {errors.slot && (
          <p className="text-sm text-danger mt-1">{errors.slot}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          name="guest_name"
          label="Guest Name"
          value={formData.guest_name}
          onChange={handleInputChange}
          error={errors.guest_name}
          placeholder="Enter guest name"
          required
        />

        <Input
          name="phone_number"
          label="Phone Number"
          type="tel"
          value={formData.phone_number}
          onChange={handleInputChange}
          error={errors.phone_number}
          placeholder="Enter phone number"
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          name="email"
          label="Email Address"
          type="email"
          value={formData.email}
          onChange={handleInputChange}
          error={errors.email}
          placeholder="Enter email address"
          required
        />

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">
            Reservation Source *
          </label>
          <select
            name="source"
            value={formData.source}
            onChange={handleInputChange}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text-primary transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            {RESERVATION_SOURCES.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="special_notes" className="block text-sm font-medium text-text-primary">
          Special Notes (Optional)
        </label>
        <textarea
          id="special_notes"
          name="special_notes"
          value={formData.special_notes}
          onChange={handleInputChange}
          placeholder="Any special requests or notes"
          rows={3}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/70 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          Create Reservation
        </Button>
      </div>
    </form>
  );
};

export default ReservationForm;

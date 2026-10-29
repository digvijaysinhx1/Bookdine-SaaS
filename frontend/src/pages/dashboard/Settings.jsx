import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth.js";
import { getSettings, updateSettings, updateRestaurantSlug } from "../../services/settingService.js";
import Loader from "../../components/Loader.jsx";
import ErrorMessage from "../../components/ErrorMessage.jsx";
import Button from "../../components/Button.jsx";
import Input from "../../components/Input.jsx";
import TimePicker from "../../components/TimePicker.jsx";
import ToggleSwitch from "../../components/ToggleSwitch.jsx";
import { copyText } from "../../utils/copyText.js";

const Settings = () => {
  const { accessToken } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [settings, setSettings] = useState({
    opening_time: "",
    closing_time: "",
    minimum_guests: 1,
    maximum_guests: 10,
    booking_window_days: 30,
    cancellation_hours_before: 24,
    email_confirmation: true,
    whatsapp_confirmation: false,
    is_active: true,
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [slugDraft, setSlugDraft] = useState("");
  const [slugSubmitting, setSlugSubmitting] = useState(false);
  const [slugFeedback, setSlugFeedback] = useState("");
  const [slugFeedbackIsError, setSlugFeedbackIsError] = useState(false);
  const publicBookingUrl = settings.public_booking_url || (
    settings.slug && import.meta.env.DEV ? `${window.location.origin}/book/${settings.slug}` : ""
  );
  const embedSnippet = publicBookingUrl
    ? `<iframe src="${publicBookingUrl}" title="Book a table" width="100%" height="720" style="border:0;max-width:100%;" loading="lazy"></iframe>`
    : "";

  useEffect(() => {
    fetchSettings();
  }, [accessToken]);

  const fetchSettings = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getSettings(accessToken);
      setSettings(data);
      setSlugDraft(data.slug || "");
    } catch (err) {
      setError(err.message || "Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!settings.opening_time) {
      errors.opening_time = "Opening time is required";
    }

    if (!settings.closing_time) {
      errors.closing_time = "Closing time is required";
    }

    if (settings.opening_time && settings.closing_time && settings.closing_time <= settings.opening_time) {
      errors.closing_time = "Closing time must be greater than opening time";
    }

    if (settings.minimum_guests <= 0) {
      errors.minimum_guests = "Minimum guests must be greater than 0";
    }

    if (settings.maximum_guests < settings.minimum_guests) {
      errors.maximum_guests = "Maximum guests must be greater than or equal to minimum guests";
    }

    if (settings.booking_window_days <= 0) {
      errors.booking_window_days = "Booking window must be greater than 0";
    }

    if (settings.cancellation_hours_before < 0) {
      errors.cancellation_hours_before = "Cancellation hours cannot be negative";
    }

    if (!settings.email_confirmation && !settings.whatsapp_confirmation) {
      errors.notifications = "At least one notification option must be enabled";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await updateSettings(accessToken, settings);
      setSuccessMessage("Settings updated successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.message || "Failed to update settings");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setValidationErrors((prev) => ({ ...prev, [field]: null, notifications: null }));
  };

  const handleSlugSubmit = async (event) => {
    event.preventDefault();
    setSlugFeedback("");
    setSlugSubmitting(true);
    const previousSlug = settings.slug;
    try {
      const saved = await updateRestaurantSlug(accessToken, slugDraft);
      setSettings((current) => ({ ...current, slug: saved.slug, public_booking_url: saved.public_booking_url }));
      setSlugDraft(saved.slug);
      setSlugFeedback(previousSlug && previousSlug !== saved.slug
        ? "Slug saved. The previous booking link will no longer resolve."
        : "Slug saved.");
      setSlugFeedbackIsError(false);
    } catch (err) {
      setSlugFeedback(err.message || "Could not save the restaurant slug.");
      setSlugFeedbackIsError(true);
    } finally {
      setSlugSubmitting(false);
    }
  };

  const handleCopyBookingUrl = async () => {
    try {
      await copyText(publicBookingUrl);
      setSlugFeedback("Booking URL copied.");
      setSlugFeedbackIsError(false);
    } catch (err) {
      setSlugFeedback(err.message || "Could not copy the booking URL.");
      setSlugFeedbackIsError(true);
    }
  };

  const handleCopyEmbed = async () => {
    try {
      await copyText(embedSnippet);
      setSlugFeedback("Embed snippet copied.");
      setSlugFeedbackIsError(false);
    } catch (err) {
      setSlugFeedback(err.message || "Could not copy the embed snippet.");
      setSlugFeedbackIsError(true);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <Loader label="Loading settings..." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-text-primary">Restaurant Settings</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage your restaurant's operating hours and booking policies
        </p>
      </div>

      {error && <ErrorMessage message={error} className="mb-6" />}

      {successMessage && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      <section className="mb-6 rounded-lg border border-border bg-surface p-6">
        <h2 className="text-lg font-medium text-text-primary">Customer Booking Slug</h2>
        <p className="mt-1 text-sm text-text-secondary">Only the slug is saved. Changing it makes the previous booking link stop resolving.</p>
        <form onSubmit={handleSlugSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <Input
            label="Restaurant slug"
            value={slugDraft}
            onChange={(event) => setSlugDraft(event.target.value)}
            maxLength={100}
            placeholder="roasted-beans-cafe"
            autoCapitalize="none"
            spellCheck={false}
            hint="Lowercase letters, numbers, and hyphens. Spaces and uppercase letters are normalized when saved."
            className="flex-1"
          />
          <Button type="submit" isLoading={slugSubmitting} disabled={slugSubmitting || !slugDraft.trim()}>
            Save slug
          </Button>
        </form>
        {slugFeedback && <p role="status" className={`mt-3 text-sm ${slugFeedbackIsError ? "text-danger" : "text-green-700"}`}>{slugFeedback}</p>}
        {settings.slug && (
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-text-secondary">Saved slug</p>
              <p className="font-medium">{settings.slug}</p>
              {publicBookingUrl ? (
                <a className="break-all text-sm text-brand-700 underline" href={publicBookingUrl} target="_blank" rel="noreferrer">{publicBookingUrl}</a>
              ) : (
                <p className="mt-1 text-sm text-amber-700">Set PUBLIC_APP_URL in the backend environment to publish an absolute booking link. For local development, the current frontend origin is used.</p>
              )}
            </div>
            <Button type="button" variant="secondary" onClick={handleCopyBookingUrl} disabled={!publicBookingUrl}>Copy booking URL</Button>
          </div>
        )}
        {embedSnippet && (
          <div className="mt-4 border-t border-border pt-4">
            <label className="block text-xs font-medium text-text-secondary" htmlFor="booking-embed">Website iframe embed</label>
            <textarea id="booking-embed" readOnly value={embedSnippet} rows={3} className="mt-2 w-full rounded-md border border-border bg-slate-50 p-3 font-mono text-xs" />
            <Button type="button" variant="secondary" className="mt-2" onClick={handleCopyEmbed}>Copy embed snippet</Button>
            <p className="mt-2 text-xs text-text-secondary">The site hosting this app must permit framing from the cafe website in its Content-Security-Policy frame-ancestors setting.</p>
          </div>
        )}
      </section>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border border-border bg-surface p-6">
          <h2 className="mb-4 text-lg font-medium text-text-primary">Opening Hours</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <TimePicker
              label="Opening Time"
              value={settings.opening_time}
              onChange={(value) => handleChange("opening_time", value)}
              error={validationErrors.opening_time}
            />
            <TimePicker
              label="Closing Time"
              value={settings.closing_time}
              onChange={(value) => handleChange("closing_time", value)}
              error={validationErrors.closing_time}
            />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-6">
          <h2 className="mb-4 text-lg font-medium text-text-primary">Guest Limits</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Minimum Guests"
              type="number"
              min="1"
              value={settings.minimum_guests}
              onChange={(e) => handleChange("minimum_guests", parseInt(e.target.value) || 0)}
              error={validationErrors.minimum_guests}
            />
            <Input
              label="Maximum Guests"
              type="number"
              min="1"
              value={settings.maximum_guests}
              onChange={(e) => handleChange("maximum_guests", parseInt(e.target.value) || 0)}
              error={validationErrors.maximum_guests}
            />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-6">
          <h2 className="mb-4 text-lg font-medium text-text-primary">Booking Policies</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Booking Window Days"
              type="number"
              min="1"
              hint="How many days in advance guests can book"
              value={settings.booking_window_days}
              onChange={(e) => handleChange("booking_window_days", parseInt(e.target.value) || 0)}
              error={validationErrors.booking_window_days}
            />
            <Input
              label="Cancellation Hours Before"
              type="number"
              min="0"
              hint="Minimum hours before cancellation"
              value={settings.cancellation_hours_before}
              onChange={(e) => handleChange("cancellation_hours_before", parseInt(e.target.value) || 0)}
              error={validationErrors.cancellation_hours_before}
            />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-6">
          <h2 className="mb-4 text-lg font-medium text-text-primary">Notifications</h2>
          <div className="space-y-4">
            <ToggleSwitch
              label="Email Confirmation"
              checked={settings.email_confirmation}
              onChange={(checked) => handleChange("email_confirmation", checked)}
            />
            <ToggleSwitch
              label="WhatsApp Confirmation"
              checked={settings.whatsapp_confirmation}
              onChange={(checked) => handleChange("whatsapp_confirmation", checked)}
            />
            {validationErrors.notifications && (
              <p className="text-sm text-danger">{validationErrors.notifications}</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-6">
          <h2 className="mb-4 text-lg font-medium text-text-primary">Restaurant Status</h2>
          <ToggleSwitch
            label="Active"
            checked={settings.is_active}
            onChange={(checked) => handleChange("is_active", checked)}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Settings;

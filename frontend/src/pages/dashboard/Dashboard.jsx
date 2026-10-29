import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "../../constants/routes.js";
import { useAuth } from "../../hooks/useAuth.js";
import { getDashboardOverview } from "../../services/dashboardService.js";
import Button from "../../components/Button.jsx";
import ErrorMessage from "../../components/ErrorMessage.jsx";
import Loader from "../../components/Loader.jsx";

const STATUSES = ["pending", "confirmed", "seated", "completed", "cancelled", "no_show"];
const formatTime = (time) => {
  const [hour, minute] = String(time || "").slice(0, 5).split(":").map(Number);
  if (!Number.isFinite(hour)) return "—";
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
};

const Dashboard = () => {
  const { accessToken, user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { setOverview(await getDashboardOverview(accessToken)); }
    catch (err) { setError(err.message || "Unable to load dashboard data"); }
    finally { setLoading(false); }
  }, [accessToken]);

  useEffect(() => { loadOverview(); }, [loadOverview]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-700">{overview?.restaurant_name || "Restaurant operations"}</p>
          <h1 className="mt-1 text-2xl font-semibold text-text-primary">Welcome, {user?.name || "there"}</h1>
          <p className="mt-1 text-sm text-text-secondary">Your reservation overview for today and the next 30 days.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-muted" to={ROUTES.reservations}>View reservations</Link>
          <Link className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-muted" to={ROUTES.tables}>Manage tables</Link>
          {user?.role === "RESTAURANT_ADMIN" && <Link className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-muted" to={ROUTES.settings}>Restaurant settings</Link>}
        </div>
      </div>

      {error && <ErrorMessage message={error} />}
      {loading ? <div className="flex min-h-48 items-center justify-center"><Loader label="Loading dashboard..." /></div> : error ? (
        <section className="rounded-xl border border-border bg-surface p-6 text-center"><p className="mb-4 text-sm text-text-secondary">Dashboard data could not be refreshed.</p><Button onClick={loadOverview}>Try again</Button></section>
      ) : overview && <>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard label="Today's reservations" value={overview.today_total} hint="Bookings scheduled for today" />
          <StatCard label="Upcoming reservations" value={overview.upcoming_total} hint="After today, through the next 30 days" />
          <StatCard label="Confirmed today" value={overview.status_counts?.confirmed || 0} hint="Confirmed in the 30 day overview" />
        </section>
        <section className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-lg font-semibold text-text-primary">Reservations by status</h2><p className="text-sm text-text-secondary">Upcoming 30 day window</p></div><Button variant="secondary" size="sm" onClick={loadOverview} disabled={loading}>Refresh</Button></div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">{STATUSES.map((status) => <div key={status} className="rounded-lg bg-surface-muted p-3"><p className="text-xs font-medium uppercase tracking-wide text-text-secondary">{status.replace("_", " ")}</p><p className="mt-1 text-xl font-semibold text-text-primary">{overview.status_counts?.[status] || 0}</p></div>)}</div>
        </section>
        <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
          <div className="border-b border-border px-5 py-4"><h2 className="text-lg font-semibold text-text-primary">Today's reservations</h2><p className="text-sm text-text-secondary">Guest, time, party size, table and status</p></div>
          {!overview.today_reservations?.length ? <div className="p-8 text-center text-sm text-text-secondary">No reservations scheduled for today.</div> : <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-surface-muted text-xs uppercase text-text-secondary"><tr><th className="px-5 py-3">Guest</th><th className="px-5 py-3">Time</th><th className="px-5 py-3">Party</th><th className="px-5 py-3">Table</th><th className="px-5 py-3">Status</th></tr></thead><tbody>{overview.today_reservations.map((reservation) => <tr key={reservation.id} className="border-t border-border"><td className="px-5 py-3 font-medium text-text-primary">{reservation.guest_name}</td><td className="px-5 py-3">{formatTime(reservation.time)}</td><td className="px-5 py-3">{reservation.guests}</td><td className="px-5 py-3">{reservation.table_number || "—"}</td><td className="px-5 py-3 capitalize">{reservation.status.replace("_", " ")}</td></tr>)}</tbody></table></div>}
        </section>
      </>}
    </div>
  );
};

const StatCard = ({ label, value, hint }) => <article className="rounded-xl border border-border bg-surface p-5 shadow-sm"><p className="text-sm font-medium text-text-secondary">{label}</p><p className="mt-2 text-3xl font-semibold text-text-primary">{value ?? 0}</p><p className="mt-1 text-xs text-text-secondary">{hint}</p></article>;
export default Dashboard;

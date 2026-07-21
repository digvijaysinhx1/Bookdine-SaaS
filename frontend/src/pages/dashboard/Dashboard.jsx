import { ROLE_LABELS } from "../../constants/roles.js";
import { useAuth } from "../../hooks/useAuth.js";

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <p className="text-sm font-medium text-brand-700">Phase 1</p>
        <h1 className="mt-2 text-2xl font-semibold text-text-primary">
          Welcome, {user?.name || "there"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-text-secondary">
          You are signed in to Bookdine. This dashboard shell is ready for
          future modules. Authentication, protected routing, and role-aware
          access are active for your account.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <InfoCard label="Role" value={ROLE_LABELS[user?.role] || user?.role} />
        <InfoCard label="Email" value={user?.email} />
        <InfoCard label="Tenant ID" value={user?.tenant_id} />
      </section>
    </div>
  );
};

const InfoCard = ({ label, value }) => (
  <article className="rounded-xl border border-border bg-surface p-5 shadow-sm">
    <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
      {label}
    </p>
    <p className="mt-2 text-lg font-semibold text-text-primary">{value ?? "—"}</p>
  </article>
);

export default Dashboard;

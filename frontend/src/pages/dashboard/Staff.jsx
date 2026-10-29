import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth.js";
import { createStaff, getStaff } from "../../services/staffService.js";
import Button from "../../components/Button.jsx";
import ErrorMessage from "../../components/ErrorMessage.jsx";
import Input from "../../components/Input.jsx";
import Loader from "../../components/Loader.jsx";
import { ROLE_LABELS, ROLES } from "../../constants/roles.js";

const Staff = () => {
  const { accessToken } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: ROLES.STAFF });

  const loadStaff = useCallback(async () => {
    setLoading(true); setError(null);
    try { setStaff(await getStaff(accessToken)); }
    catch (err) { setError(err.message || "Unable to load staff accounts"); }
    finally { setLoading(false); }
  }, [accessToken]);

  useEffect(() => { loadStaff(); }, [loadStaff]);

  const handleSubmit = async (event) => {
    event.preventDefault(); setError(null); setSuccess(""); setSubmitting(true);
    try {
      await createStaff(accessToken, form);
      setForm({ name: "", email: "", password: "", role: ROLES.STAFF });
      setSuccess("Staff account created. Share the temporary password with the staff member securely.");
      await loadStaff();
    } catch (err) { setError(err.message || "Unable to create staff account"); }
    finally { setSubmitting(false); }
  };

  return <div className="mx-auto max-w-6xl space-y-6">
    <header><h1 className="text-2xl font-semibold text-text-primary">Staff management</h1><p className="mt-1 text-sm text-text-secondary">Create accounts for your restaurant team. Passwords are stored as secure hashes.</p></header>
    {error && <ErrorMessage message={error} />}
    {success && <p role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</p>}
    <section className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-text-primary">Create staff account</h2>
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <Input label="Full name" value={form.name} maxLength={120} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
        <Input label="Email" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
        <Input label="Temporary password" type="password" minLength={12} maxLength={128} hint="At least 12 characters. Share it securely." value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} required />
        <label className="text-sm font-medium text-text-secondary">Role<select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))} className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2 text-text-primary"><option value={ROLES.STAFF}>Staff</option><option value={ROLES.MANAGER}>Manager</option></select></label>
        <div className="sm:col-span-2"><Button type="submit" isLoading={submitting} disabled={submitting}>Create account</Button></div>
      </form>
    </section>
    <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 className="text-lg font-semibold text-text-primary">Restaurant team</h2><p className="text-sm text-text-secondary">Accounts assigned to this restaurant</p></div><Button variant="secondary" size="sm" onClick={loadStaff} disabled={loading}>Refresh</Button></div>
      {loading ? <div className="flex min-h-32 items-center justify-center"><Loader label="Loading staff..." /></div> : staff.length === 0 ? <p className="p-8 text-center text-sm text-text-secondary">No staff accounts yet.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-left text-sm"><thead className="bg-surface-muted text-xs uppercase text-text-secondary"><tr><th className="px-5 py-3">Name</th><th className="px-5 py-3">Email</th><th className="px-5 py-3">Role</th><th className="px-5 py-3">Status</th></tr></thead><tbody>{staff.map((member) => <tr key={member.email} className="border-t border-border"><td className="px-5 py-3 font-medium text-text-primary">{member.name}</td><td className="px-5 py-3">{member.email}</td><td className="px-5 py-3">{ROLE_LABELS[member.role] || member.role}</td><td className="px-5 py-3">{member.is_active === false ? "Inactive" : "Active"}</td></tr>)}</tbody></table></div>}
    </section>
  </div>;
};

export default Staff;

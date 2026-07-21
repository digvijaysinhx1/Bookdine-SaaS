import { NavLink } from "react-router-dom";
import { ROUTES } from "../constants/routes.js";
import Button from "./Button.jsx";
import { useAuth } from "../hooks/useAuth.js";

const navLinkClasses = ({ isActive }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
    isActive
      ? "bg-brand-50 text-brand-700"
      : "text-text-secondary hover:bg-surface-muted hover:text-text-primary"
  }`;

const Sidebar = ({ isOpen, onClose }) => {
  const { logout, isSubmitting } = useAuth();

  const handleLogout = async () => {
    await logout();
    onClose?.();
  };

  return (
    <>
      {isOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          aria-label="Close sidebar"
          onClick={onClose}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-surface transition-transform duration-200 lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="border-b border-border px-6 py-5">
          <p className="text-lg font-semibold text-text-primary">Bookdine</p>
          <p className="text-xs text-text-secondary">Restaurant Dashboard</p>
        </div>

        <nav className="flex-1 space-y-1 px-4 py-4" aria-label="Main navigation">
          <NavLink to={ROUTES.dashboard} className={navLinkClasses} onClick={onClose}>
            <DashboardIcon />
            Dashboard
          </NavLink>
        </nav>

        <div className="border-t border-border p-4">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={handleLogout}
            isLoading={isSubmitting}
          >
            <LogoutIcon />
            Logout
          </Button>
        </div>
      </aside>
    </>
  );
};

const DashboardIcon = () => (
  <svg
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4"
    />
  </svg>
);

const LogoutIcon = () => (
  <svg
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"
    />
  </svg>
);

export default Sidebar;

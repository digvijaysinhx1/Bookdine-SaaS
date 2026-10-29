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
  const { logout, isSubmitting, user } = useAuth();

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
        className={`sticky inset-y-0 left-0 z-50 flex w-72 h-screen flex-col border-r border-border bg-surface transition-transform duration-200 lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="border-b border-border px-6 py-5">
          <p className="text-lg font-semibold text-text-primary">Bookdine</p>
          <p className="text-xs text-text-secondary">Restaurant Dashboard</p>
        </div>

        <nav className="flex-1 space-y-1 px-4 py-4 " aria-label="Main navigation">
          <NavLink to={ROUTES.dashboard} className={navLinkClasses} onClick={onClose}>
            <DashboardIcon />
            Dashboard
          </NavLink>
          <NavLink to={ROUTES.tables} className={navLinkClasses} onClick={onClose}>
            <TablesIcon />
            Tables
          </NavLink>
          <NavLink to={ROUTES.reservations} className={navLinkClasses} onClick={onClose}>
            <ReservationsIcon />
            Reservations
          </NavLink>
          {user?.role === "RESTAURANT_ADMIN" && <>
            <NavLink to={ROUTES.settings} className={navLinkClasses} onClick={onClose}><SettingsIcon />Restaurant Settings</NavLink>
            <NavLink to={ROUTES.staff} className={navLinkClasses} onClick={onClose}><StaffIcon />Staff Management</NavLink>
          </>}
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

const TablesIcon = () => (
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
      d="M4 6h16M4 10h16M4 14h16M4 18h16"
    />
  </svg>
);

const ReservationsIcon = () => (
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
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const SettingsIcon = () => (
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
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
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

const StaffIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2m16 0v-2a4 4 0 00-3-3.87M14 3.13a4 4 0 010 7.75M14 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

export default Sidebar;

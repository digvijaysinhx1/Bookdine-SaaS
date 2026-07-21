import { ROLE_LABELS } from "../constants/roles.js";
import { useAuth } from "../hooks/useAuth.js";

const Navbar = ({ onMenuClick }) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex rounded-lg p-2 text-text-secondary hover:bg-surface-muted lg:hidden"
            aria-label="Open navigation menu"
            onClick={onMenuClick}
          >
            <MenuIcon />
          </button>
          <div>
            <p className="text-sm font-medium text-text-primary">Dashboard</p>
            <p className="text-xs text-text-secondary">Welcome back</p>
          </div>
        </div>

        {user ? (
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-text-primary">{user.name}</p>
              <p className="text-xs text-text-secondary">{user.email}</p>
            </div>
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
              {ROLE_LABELS[user.role] || user.role}
            </span>
          </div>
        ) : null}
      </div>
    </header>
  );
};

const MenuIcon = () => (
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
      d="M4 6h16M4 12h16M4 18h16"
    />
  </svg>
);

export default Navbar;

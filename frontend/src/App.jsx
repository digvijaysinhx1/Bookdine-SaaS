import { Navigate, Route, Routes } from "react-router-dom";
import { ROUTES } from "./constants/routes.js";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { useAuth } from "./hooks/useAuth.js";
import AuthLayout from "./layouts/AuthLayout.jsx";
import DashboardLayout from "./layouts/DashboardLayout.jsx";
import Login from "./pages/auth/Login.jsx";
import Dashboard from "./pages/dashboard/Dashboard.jsx";
import Settings from "./pages/dashboard/Settings.jsx";
import Tables from "./pages/dashboard/Tables.jsx";
import Loader from "./components/Loader.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import PublicRoute from "./routes/PublicRoute.jsx";

const App = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
};

const AppRoutes = () => {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader label="Loading application..." />
      </div>
    );
  }

  const defaultRoute = isAuthenticated ? ROUTES.dashboard : ROUTES.login;

  return (
    <Routes>
      <Route path={ROUTES.root} element={<Navigate to={defaultRoute} replace />} />

      <Route element={<PublicRoute />}>
        <Route element={<AuthLayout />}>
          <Route path={ROUTES.login} element={<Login />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path={ROUTES.dashboard} element={<Dashboard />} />
          <Route path={ROUTES.tables} element={<Tables />} />
          <Route path={ROUTES.settings} element={<Settings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={defaultRoute} replace />} />
    </Routes>
  );
};

export default App;

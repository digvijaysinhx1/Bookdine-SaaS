import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "../../components/Button.jsx";
import ErrorMessage from "../../components/ErrorMessage.jsx";
import Input from "../../components/Input.jsx";
import { ROUTES } from "../../constants/routes.js";
import { useAuth } from "../../hooks/useAuth.js";
import { validateLoginForm } from "../../utils/validation.js";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isSubmitting, authError, clearAuthError } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);

  const redirectPath = location.state?.from?.pathname || ROUTES.dashboard;
  const sessionMessage = location.state?.message;

  useEffect(() => {
    clearAuthError();
  }, [clearAuthError]);

  useEffect(() => {
    if (sessionMessage) {
      setFormError(sessionMessage);
    }
  }, [sessionMessage]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));

    setFieldErrors((current) => ({ ...current, [name]: undefined }));
    setFormError(null);
    clearAuthError();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationErrors = validateLoginForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }

    setFieldErrors({});
    setFormError(null);

    try {
      await login({
        email: formData.email.trim(),
        password: formData.password,
        rememberMe: formData.rememberMe,
      });
      navigate(redirectPath, { replace: true });
    } catch {
      // Error state is handled by AuthContext and surfaced below.
    }
  };

  const displayedError = formError || authError;

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-text-primary">Sign in</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Enter your credentials to access the dashboard.
        </p>
      </div>

      {displayedError ? (
        <ErrorMessage
          title="Unable to sign in"
          message={displayedError}
          className="mb-5"
        />
      ) : null}

      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <Input
          id="email"
          name="email"
          type="email"
          label="Email"
          autoComplete="email"
          placeholder="you@restaurant.com"
          value={formData.email}
          onChange={handleChange}
          error={fieldErrors.email}
          disabled={isSubmitting}
        />

        <Input
          id="password"
          name="password"
          type={showPassword ? "text" : "password"}
          label="Password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={handleChange}
          error={fieldErrors.password}
          disabled={isSubmitting}
          endAdornment={
            <button
              type="button"
              className="rounded-md p-1 text-text-secondary hover:text-text-primary"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          }
        />

        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input
            type="checkbox"
            name="rememberMe"
            checked={formData.rememberMe}
            onChange={handleChange}
            disabled={isSubmitting}
            className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-500"
          />
          Remember me
        </label>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          isLoading={isSubmitting}
        >
          Sign in
        </Button>
      </form>
    </div>
  );
};

const EyeIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    />
  </svg>
);

const EyeOffIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858 3.02a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
    />
  </svg>
);

export default Login;

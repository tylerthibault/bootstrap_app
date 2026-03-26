"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { registerWithPassword } from "../../lib/auth";

function getPasswordStrength(password: string): { label: string; color: string } | null {
  if (!password) return null;
  if (password.length < 8) return { label: "Too short", color: "#b91c1c" };
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const strength = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
  if (strength <= 2) return { label: "Weak", color: "#d97706" };
  if (strength === 3) return { label: "Good", color: "#2563eb" };
  return { label: "Strong", color: "#166534" };
}

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const passwordStrength = getPasswordStrength(password);
  const passwordsMatch = !confirmPassword || password === confirmPassword;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    const result = await registerWithPassword({
      email: email.trim(),
      password: password.trim(),
      displayName: displayName.trim() || undefined,
    });

    if (!result.ok) {
      setError(result.error ?? "Registration failed.");
      setLoading(false);
      return;
    }

    router.push(result.role === "admin" ? "/admin" : "/dashboard");
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div>
          <h1 className="app-title">Create an account</h1>
          <p className="app-copy" style={{ marginTop: 6 }}>Get started — it only takes a moment.</p>
        </div>

        <form onSubmit={onSubmit} className="auth-fields">
          <div className="input-group">
            <label htmlFor="displayName" className="input-label">Name <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(optional)</span></label>
            <input
              id="displayName"
              className="app-input"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
            />
          </div>

          <div className="input-group">
            <label htmlFor="email" className="input-label">Email address</label>
            <input
              id="email"
              className="app-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password" className="input-label">Password</label>
            <div className="input-with-action">
              <input
                id="password"
                className="app-input"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="input-action-btn"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {passwordStrength ? (
              <span style={{ fontSize: 13, color: passwordStrength.color, fontWeight: 500 }}>
                {passwordStrength.label}
              </span>
            ) : null}
          </div>

          <div className="input-group">
            <label htmlFor="confirmPassword" className="input-label">Confirm password</label>
            <input
              id="confirmPassword"
              className="app-input"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              required
              style={confirmPassword && !passwordsMatch ? { borderColor: "var(--color-danger)" } : undefined}
            />
            {confirmPassword && !passwordsMatch ? (
              <span style={{ fontSize: 13, color: "var(--color-danger)", fontWeight: 500 }}>Passwords do not match</span>
            ) : null}
          </div>

          {error ? <p className="app-alert-error" role="alert">{error}</p> : null}

          <button
            className="app-button-primary"
            type="submit"
            disabled={loading || !email.trim() || !password.trim() || !confirmPassword.trim() || !passwordsMatch}
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{" "}
          <Link href="/login" className="app-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}


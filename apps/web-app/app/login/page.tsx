"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { loginWithPassword, requireSession } from "../../lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkExistingSession() {
      const session = await requireSession("user");
      if (session.ok) {
        router.replace(session.role === "admin" ? "/admin" : "/dashboard");
      }
    }

    void checkExistingSession();
  }, [router]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const result = await loginWithPassword({ email, password });

    if (!result.ok) {
      setError(result.error ?? "Login failed.");
      setLoading(false);
      return;
    }

    router.push(result.role === "admin" ? "/admin" : "/dashboard");
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div>
          <h1 className="app-title">Welcome back</h1>
          <p className="app-copy" style={{ marginTop: 6 }}>Sign in to your account to continue.</p>
        </div>

        <form onSubmit={onSubmit} className="auth-fields">
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label htmlFor="password" className="input-label">Password</label>
            </div>
            <div className="input-with-action">
              <input
                id="password"
                className="app-input"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
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
          </div>

          {error ? <p className="app-alert-error" role="alert">{error}</p> : null}

          <button className="app-button-primary" type="submit" disabled={loading || !email.trim() || !password.trim()}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="auth-footer">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="app-link">Create one</Link>
        </p>
      </div>
    </div>
  );
}


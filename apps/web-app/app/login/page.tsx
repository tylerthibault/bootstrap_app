"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { loginWithPassword, requireSession } from "../../lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("Passw0rd!");
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
    <section className="app-card">
      <h1 className="app-title">Web App Login</h1>
      <p className="app-copy">Authenticated browser app entrypoint.</p>
      <form onSubmit={onSubmit} className="app-list">
        <input className="app-input" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" />
        <input className="app-input" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" type="password" />
        <button className="app-button" type="submit" disabled={loading}>{loading ? "Signing in..." : "Login"}</button>
      </form>
      {error ? <p className="app-error">{error}</p> : null}
      <Link href="/register">Go to register</Link>
    </section>
  );
}

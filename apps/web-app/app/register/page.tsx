"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { registerWithPassword } from "../../lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("user@example.com");
  const [password, setPassword] = useState("Passw0rd!");
  const [displayName, setDisplayName] = useState("Web User");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const result = await registerWithPassword({
      email,
      password,
      displayName,
    });

    if (!result.ok) {
      setError(result.error ?? "Registration failed.");
      setLoading(false);
      return;
    }

    router.push(result.role === "admin" ? "/admin" : "/dashboard");
  }

  return (
    <section className="app-card">
      <h1 className="app-title">Web App Register</h1>
      <form onSubmit={onSubmit} className="app-list">
        <input className="app-input" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" />
        <input className="app-input" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" type="password" />
        <input className="app-input" value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Display name" />
        <button className="app-button" type="submit" disabled={loading}>{loading ? "Registering..." : "Register"}</button>
      </form>
      {error ? <p className="app-error">{error}</p> : null}
      <Link href="/login">Go to login</Link>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { apiAuthedRequest } from "../../lib/api";
import { getRefreshToken, logoutSession, requireSession } from "../../lib/auth";

type Profile = {
  id: number;
  email: string;
  display_name?: string | null;
  roles?: string[];
  status?: string;
};

type SessionItem = {
  id: number;
  device_id?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  is_active?: boolean;
  created_at?: string;
  last_activity_at?: string;
};

type ActivityItem = {
  id: number;
  action: string;
  route: string;
  created_at?: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionLoading, setActionLoading] = useState("");
  const [profile, setProfile] = useState<Profile | undefined>(undefined);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  async function loadDashboardData() {
    setLoading(true);
    setError("");

    const session = await requireSession("user");
    if (!session.ok) {
      setLoading(false);
      setError(session.error ?? "Please log in to continue.");
      return;
    }

    const [profileResult, sessionsResult, activityResult] = await Promise.all([
      apiAuthedRequest("/api/users/me"),
      apiAuthedRequest("/api/sessions/me"),
      apiAuthedRequest("/api/logs/activity/recent?limit=10"),
    ]);

    if (!profileResult.ok || !sessionsResult.ok || !activityResult.ok) {
      if (profileResult.status === 401 || sessionsResult.status === 401 || activityResult.status === 401) {
        setError("Session expired. Please log in again.");
      } else {
        setError(
          profileResult.payload?.error?.message ??
            sessionsResult.payload?.error?.message ??
            activityResult.payload?.error?.message ??
            "Failed to load dashboard data.",
        );
      }
      setLoading(false);
      return;
    }

    setProfile(profileResult.payload?.data?.profile);
    setSessions(Array.isArray(sessionsResult.payload?.data?.sessions) ? sessionsResult.payload.data.sessions : []);
    setActivity(Array.isArray(activityResult.payload?.data?.activity) ? activityResult.payload.data.activity : []);
    setLoading(false);
  }

  useEffect(() => {
    void loadDashboardData();
  }, []);

  async function logoutCurrentSession() {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      setError("Refresh token missing. Please log in again.");
      return;
    }

    setActionLoading("current");
    setError("");
    setActionMessage("");

    const result = await apiAuthedRequest("/api/sessions/current/logout", {
      method: "POST",
      body: { refresh_token: refreshToken },
    });

    setActionLoading("");

    if (!result.ok) {
      setError(result.payload?.error?.message ?? "Failed to logout current session.");
      return;
    }

    await logoutSession();
    router.push("/login");
  }

  async function logoutAllSessions() {
    setActionLoading("all");
    setError("");
    setActionMessage("");

    const result = await apiAuthedRequest("/api/sessions/all/logout", {
      method: "POST",
    });

    setActionLoading("");

    if (!result.ok) {
      setError(result.payload?.error?.message ?? "Failed to logout all sessions.");
      return;
    }

    await logoutSession({ all: true });
    router.push("/login");
  }

  return (
    <section className="app-card">
      <h1 className="app-title">User Dashboard</h1>
      {loading ? <p className="app-copy">Loading...</p> : null}
      {error ? <p className="app-error">{error}</p> : null}
      {actionMessage ? <p className="app-success">{actionMessage}</p> : null}
      {profile ? (
        <div className="app-list">
          <p className="app-copy">ID: {profile.id}</p>
          <p className="app-copy">Email: {profile.email}</p>
          <p className="app-copy">Name: {profile.display_name ?? "-"}</p>
          <p className="app-copy">Roles: {profile.roles?.join(", ") ?? "-"}</p>
          <p className="app-copy">Status: {profile.status ?? "-"}</p>
        </div>
      ) : null}
      <section className="app-list">
        <h2 className="app-section-title">Recent Activity</h2>
        {activity.length === 0 ? <p className="app-copy">No recent activity.</p> : null}
        {activity.slice(0, 5).map((item) => (
          <p key={item.id} className="app-copy">
            {item.action} on {item.route} ({item.created_at ?? "-"})
          </p>
        ))}
      </section>
      <section className="app-list">
        <h2 className="app-section-title">Active Sessions</h2>
        {sessions.length === 0 ? <p className="app-copy">No sessions found.</p> : null}
        {sessions.slice(0, 5).map((item) => (
          <p key={item.id} className="app-copy">
            #{item.id} · {item.ip_address ?? "-"} · {item.is_active ? "active" : "revoked"}
          </p>
        ))}
      </section>
      <div className="app-row">
        <button className="app-button" onClick={logoutCurrentSession} disabled={actionLoading.length > 0}>
          {actionLoading === "current" ? "Logging out current..." : "Logout Current Session"}
        </button>
        <button className="app-button" onClick={logoutAllSessions} disabled={actionLoading.length > 0}>
          {actionLoading === "all" ? "Logging out all..." : "Logout All Sessions"}
        </button>
        <button className="app-button" onClick={() => void loadDashboardData()} disabled={loading || actionLoading.length > 0}>Reload</button>
        <Link href="/admin">Admin Shell</Link>
      </div>
      <button
        className="app-button"
        onClick={async () => {
          await logoutSession({ all: true });
          router.push("/login");
        }}
        disabled={actionLoading.length > 0}
      >
        Logout
      </button>
    </section>
  );
}

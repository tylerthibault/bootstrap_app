"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { apiAuthedRequest } from "../../lib/api";
import { logoutSession, requireSession } from "../../lib/auth";

type Viewer = {
  user_id: number;
  roles: string[];
};

type AdminUser = {
  id: number;
  email: string;
  status: string;
  roles: string[];
};

type AuditLog = {
  id: number;
  action: string;
  actor_user_id?: number;
  target_user_id?: number;
  created_at?: string;
};

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [viewer, setViewer] = useState<Viewer | undefined>(undefined);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(0);
  const [roleInput, setRoleInput] = useState("user");
  const [statusInput, setStatusInput] = useState("active");
  const [auditActionFilter, setAuditActionFilter] = useState("");

  async function loadAdminData() {
    setLoading(true);
    setError("");
    setMessage("");

    const session = await requireSession("admin");
    if (!session.ok) {
      setLoading(false);
      setForbidden(Boolean(session.forbidden));
      setError(session.error ?? "Admin access required.");
      return;
    }

    setForbidden(false);

    const [viewerResult, usersResult, logsResult] = await Promise.all([
      apiAuthedRequest("/api/admin/"),
      apiAuthedRequest(
        `/api/admin/users?q=${encodeURIComponent(query)}&status=${encodeURIComponent(statusFilter)}&role=${encodeURIComponent(roleFilter)}&page=1&page_size=10`,
      ),
      apiAuthedRequest(`/api/admin/audit-logs?action=${encodeURIComponent(auditActionFilter)}&page=1&page_size=10`),
    ]);

    if (!viewerResult.ok || !usersResult.ok || !logsResult.ok) {
      const statusCodes = [viewerResult.status, usersResult.status, logsResult.status];
      if (statusCodes.includes(403)) {
        setForbidden(true);
        setError("Forbidden: admin access is required.");
      } else if (statusCodes.includes(401)) {
        setError("Session expired. Please log in again.");
      } else {
        setError(
          viewerResult.payload?.error?.message ??
            usersResult.payload?.error?.message ??
            logsResult.payload?.error?.message ??
            "Failed to load admin data.",
        );
      }
      setLoading(false);
      return;
    }

    const nextUsers = Array.isArray(usersResult.payload?.data?.users) ? usersResult.payload.data.users : [];
    setViewer(viewerResult.payload?.data?.viewer);
    setUsers(nextUsers);
    setAuditLogs(Array.isArray(logsResult.payload?.data?.logs) ? logsResult.payload.data.logs : []);
    setSelectedUserId(nextUsers.length > 0 ? nextUsers[0].id : 0);
    setLoading(false);
  }

  useEffect(() => {
    void loadAdminData();
  }, []);

  async function assignRoles() {
    if (!selectedUserId) {
      setError("Select a user first.");
      return;
    }

    setActionLoading(true);
    setError("");
    setMessage("");

    const roles = roleInput
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    const result = await apiAuthedRequest(`/api/admin/users/${selectedUserId}/roles`, {
      method: "PUT",
      body: { roles },
    });

    setActionLoading(false);

    if (!result.ok) {
      if (result.status === 403) {
        setForbidden(true);
      }
      setError(result.payload?.error?.message ?? "Failed to assign roles.");
      return;
    }

    setMessage("Roles updated.");
    await loadAdminData();
  }

  async function updateStatus() {
    if (!selectedUserId) {
      setError("Select a user first.");
      return;
    }

    setActionLoading(true);
    setError("");
    setMessage("");

    const result = await apiAuthedRequest(`/api/admin/users/${selectedUserId}/status`, {
      method: "PATCH",
      body: { status: statusInput },
    });

    setActionLoading(false);

    if (!result.ok) {
      if (result.status === 403) {
        setForbidden(true);
      }
      setError(result.payload?.error?.message ?? "Failed to update user status.");
      return;
    }

    setMessage("User status updated.");
    await loadAdminData();
  }

  async function revokeSessions() {
    if (!selectedUserId) {
      setError("Select a user first.");
      return;
    }

    setActionLoading(true);
    setError("");
    setMessage("");

    const result = await apiAuthedRequest(`/api/admin/users/${selectedUserId}/sessions/revoke`, {
      method: "POST",
    });

    setActionLoading(false);

    if (!result.ok) {
      if (result.status === 403) {
        setForbidden(true);
      }
      setError(result.payload?.error?.message ?? "Failed to revoke sessions.");
      return;
    }

    setMessage("User sessions revoked.");
    await loadAdminData();
  }

  return (
    <section className="app-card">
      <h1 className="app-title">Admin Dashboard</h1>
      {loading ? <p className="app-copy">Loading...</p> : null}
      {error ? <p className="app-error">{error}</p> : null}
      {message ? <p className="app-success">{message}</p> : null}
      {forbidden ? <p className="app-error">Forbidden: this account does not have admin access.</p> : null}
      {viewer ? (
        <div className="app-list">
          <p className="app-copy">Viewer User ID: {viewer.user_id}</p>
          <p className="app-copy">Roles: {viewer.roles.join(", ")}</p>
        </div>
      ) : null}
      <section className="app-list">
        <h2 className="app-section-title">Users</h2>
        <div className="app-row">
          <input className="app-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search email/display name" />
          <input className="app-input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} placeholder="Filter status" />
          <input className="app-input" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} placeholder="Filter role" />
          <button className="app-button" onClick={() => void loadAdminData()} disabled={loading || actionLoading}>Apply</button>
        </div>
        {users.length === 0 ? <p className="app-copy">No users found.</p> : null}
        {users.slice(0, 5).map((item) => (
          <label key={item.id} className="app-row">
            <input
              type="radio"
              name="selected-user"
              checked={selectedUserId === item.id}
              onChange={() => setSelectedUserId(item.id)}
            />
            <span>
              #{item.id} · {item.email} · {item.status} · roles: {item.roles.join(", ") || "-"}
            </span>
          </label>
        ))}
      </section>
      <section className="app-list">
        <h2 className="app-section-title">Actions</h2>
        <div className="app-row">
          <input className="app-input" value={roleInput} onChange={(event) => setRoleInput(event.target.value)} placeholder="Roles, comma-separated" />
          <button className="app-button" onClick={() => void assignRoles()} disabled={actionLoading || forbidden}>Assign Roles</button>
        </div>
        <div className="app-row">
          <select className="app-input" value={statusInput} onChange={(event) => setStatusInput(event.target.value)}>
            <option value="active">active</option>
            <option value="disabled">disabled</option>
          </select>
          <button className="app-button" onClick={() => void updateStatus()} disabled={actionLoading || forbidden}>Update Status</button>
          <button className="app-button" onClick={() => void revokeSessions()} disabled={actionLoading || forbidden}>Revoke Sessions</button>
        </div>
      </section>
      <section className="app-list">
        <h2 className="app-section-title">Audit Logs</h2>
        <div className="app-row">
          <input className="app-input" value={auditActionFilter} onChange={(event) => setAuditActionFilter(event.target.value)} placeholder="Action filter" />
          <button className="app-button" onClick={() => void loadAdminData()} disabled={loading || actionLoading}>Apply</button>
        </div>
        {auditLogs.length === 0 ? <p className="app-copy">No audit logs found.</p> : null}
        {auditLogs.slice(0, 5).map((log) => (
          <p key={log.id} className="app-copy">
            #{log.id} · {log.action} · actor {log.actor_user_id ?? "-"} · target {log.target_user_id ?? "-"}
          </p>
        ))}
      </section>
      <button
        className="app-button"
        onClick={async () => {
          await logoutSession({ all: true });
          router.push("/login");
        }}
        disabled={actionLoading}
      >
        Logout
      </button>
      <Link href="/dashboard">Back to user dashboard</Link>
    </section>
  );
}

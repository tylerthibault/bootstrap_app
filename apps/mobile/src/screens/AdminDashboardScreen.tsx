import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { mobileTheme } from "../theme/tokens";

type AdminUser = {
  id: number;
  email: string;
  display_name?: string | null;
  status: string;
  roles: string[];
};

type Pagination = {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
};

type AuditLog = {
  id: number;
  actor_user_id?: number | null;
  target_user_id?: number | null;
  action: string;
  created_at: string;
};

const DEFAULT_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:5299";
const DEFAULT_ACCESS_TOKEN = process.env.EXPO_PUBLIC_ACCESS_TOKEN ?? "";

export function AdminDashboardScreen() {
  const [apiBaseUrl, setApiBaseUrl] = useState(DEFAULT_API_BASE_URL);
  const [accessToken, setAccessToken] = useState(DEFAULT_ACCESS_TOKEN);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [userQuery, setUserQuery] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userPagination, setUserPagination] = useState<Pagination>({
    page: 1,
    page_size: 10,
    total: 0,
    total_pages: 0,
  });

  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [roleInput, setRoleInput] = useState("user");
  const [statusInput, setStatusInput] = useState("active");

  const [auditActionFilter, setAuditActionFilter] = useState("");
  const [auditPage, setAuditPage] = useState(1);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditPagination, setAuditPagination] = useState<Pagination>({
    page: 1,
    page_size: 10,
    total: 0,
    total_pages: 0,
  });

  const authHeaders = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  const fetchUsers = useCallback(async () => {
    if (!apiBaseUrl || !accessToken) {
      setError("API base URL and admin access token are required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const url = new URL(`${apiBaseUrl}/api/admin/users`);
      url.searchParams.set("page", String(userPage));
      url.searchParams.set("page_size", "10");
      if (userQuery.trim()) {
        url.searchParams.set("q", userQuery.trim());
      }
      if (userStatusFilter.trim()) {
        url.searchParams.set("status", userStatusFilter.trim());
      }
      if (userRoleFilter.trim()) {
        url.searchParams.set("role", userRoleFilter.trim());
      }

      const response = await fetch(url.toString(), { headers: authHeaders });
      if (!response.ok) {
        throw new Error("Failed to fetch admin users.");
      }
      const body = await response.json();
      setUsers(body.data.users ?? []);
      setUserPagination(body.data.pagination ?? userPagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error while loading users.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, apiBaseUrl, userPage, userQuery, userRoleFilter, userStatusFilter]);

  const fetchAuditLogs = useCallback(async () => {
    if (!apiBaseUrl || !accessToken) {
      setError("API base URL and admin access token are required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const url = new URL(`${apiBaseUrl}/api/admin/audit-logs`);
      url.searchParams.set("page", String(auditPage));
      url.searchParams.set("page_size", "10");
      if (auditActionFilter.trim()) {
        url.searchParams.set("action", auditActionFilter.trim());
      }
      const response = await fetch(url.toString(), { headers: authHeaders });
      if (!response.ok) {
        throw new Error("Failed to fetch audit logs.");
      }
      const body = await response.json();
      setAuditLogs(body.data.logs ?? []);
      setAuditPagination(body.data.pagination ?? auditPagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error while loading audit logs.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, apiBaseUrl, auditActionFilter, auditPage]);

  const applyRoleAssignment = useCallback(async () => {
    if (!selectedUserId) {
      setError("Select a user before assigning roles.");
      return;
    }
    const roles = roleInput
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
    if (roles.length === 0) {
      setError("Enter at least one role.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/users/${selectedUserId}/roles`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({ roles }),
      });
      if (!response.ok) {
        throw new Error("Failed to assign roles.");
      }
      await fetchUsers();
      await fetchAuditLogs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error while assigning roles.");
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, fetchAuditLogs, fetchUsers, roleInput, selectedUserId]);

  const confirmStatusUpdate = useCallback(() => {
    if (!selectedUserId) {
      setError("Select a user before changing status.");
      return;
    }

    Alert.alert("Confirm Status Change", `Set user ${selectedUserId} status to ${statusInput}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          setError(null);
          try {
            const response = await fetch(`${apiBaseUrl}/api/admin/users/${selectedUserId}/status`, {
              method: "PATCH",
              headers: authHeaders,
              body: JSON.stringify({ status: statusInput.trim().toLowerCase() }),
            });
            if (!response.ok) {
              throw new Error("Failed to update user status.");
            }
            await fetchUsers();
            await fetchAuditLogs();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Unexpected error while updating user status.");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  }, [apiBaseUrl, fetchAuditLogs, fetchUsers, selectedUserId, statusInput]);

  const confirmSessionRevocation = useCallback(() => {
    if (!selectedUserId) {
      setError("Select a user before revoking sessions.");
      return;
    }

    Alert.alert("Confirm Session Revocation", `Revoke all active sessions for user ${selectedUserId}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Revoke",
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          setError(null);
          try {
            const response = await fetch(`${apiBaseUrl}/api/admin/users/${selectedUserId}/sessions/revoke`, {
              method: "POST",
              headers: authHeaders,
              body: JSON.stringify({}),
            });
            if (!response.ok) {
              throw new Error("Failed to revoke sessions.");
            }
            await fetchAuditLogs();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Unexpected error while revoking sessions.");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  }, [apiBaseUrl, fetchAuditLogs, selectedUserId]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Admin Dashboard</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Admin API</Text>
        <TextInput style={styles.input} value={apiBaseUrl} onChangeText={setApiBaseUrl} autoCapitalize="none" placeholder="API Base URL" />
        <TextInput style={styles.input} value={accessToken} onChangeText={setAccessToken} autoCapitalize="none" placeholder="Admin Access Token" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>User Search / Filter</Text>
        <TextInput style={styles.input} value={userQuery} onChangeText={setUserQuery} placeholder="Search email or name" />
        <TextInput style={styles.input} value={userStatusFilter} onChangeText={setUserStatusFilter} placeholder="Status filter (active/disabled)" />
        <TextInput style={styles.input} value={userRoleFilter} onChangeText={setUserRoleFilter} placeholder="Role filter (admin/user)" />
        <View style={styles.row}>
          <Pressable
            style={styles.button}
            onPress={() => {
              setUserPage(1);
              void fetchUsers();
            }}
          >
            <Text style={styles.buttonText}>Load Users</Text>
          </Pressable>
          <Pressable style={styles.button} onPress={() => setUserPage(Math.max(1, userPage - 1))}>
            <Text style={styles.buttonText}>Prev</Text>
          </Pressable>
          <Pressable style={styles.button} onPress={() => setUserPage(userPage + 1)}>
            <Text style={styles.buttonText}>Next</Text>
          </Pressable>
        </View>
        <Text>
          Page {userPagination.page} / {Math.max(1, userPagination.total_pages)} · Total {userPagination.total}
        </Text>
        {users.map((user) => (
          <Pressable key={user.id} style={styles.card} onPress={() => setSelectedUserId(user.id)}>
            <Text>
              #{user.id} {user.email}
            </Text>
            <Text>Status: {user.status}</Text>
            <Text>Roles: {user.roles.join(", ") || "-"}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>User Management</Text>
        <Text>Selected User: {selectedUserId ?? "none"}</Text>
        <TextInput style={styles.input} value={roleInput} onChangeText={setRoleInput} placeholder="Roles (comma separated)" />
        <Pressable style={styles.button} onPress={() => void applyRoleAssignment()}>
          <Text style={styles.buttonText}>Assign Roles</Text>
        </Pressable>
        <TextInput style={styles.input} value={statusInput} onChangeText={setStatusInput} placeholder="Status (active/disabled)" />
        <Pressable style={styles.button} onPress={confirmStatusUpdate}>
          <Text style={styles.buttonText}>Update Status</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={confirmSessionRevocation}>
          <Text style={styles.buttonText}>Revoke Sessions</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Audit Log Browser</Text>
        <TextInput style={styles.input} value={auditActionFilter} onChangeText={setAuditActionFilter} placeholder="Action filter" />
        <View style={styles.row}>
          <Pressable
            style={styles.button}
            onPress={() => {
              setAuditPage(1);
              void fetchAuditLogs();
            }}
          >
            <Text style={styles.buttonText}>Load Logs</Text>
          </Pressable>
          <Pressable style={styles.button} onPress={() => setAuditPage(Math.max(1, auditPage - 1))}>
            <Text style={styles.buttonText}>Prev</Text>
          </Pressable>
          <Pressable style={styles.button} onPress={() => setAuditPage(auditPage + 1)}>
            <Text style={styles.buttonText}>Next</Text>
          </Pressable>
        </View>
        <Text>
          Page {auditPagination.page} / {Math.max(1, auditPagination.total_pages)} · Total {auditPagination.total}
        </Text>
        {auditLogs.map((log) => (
          <View key={log.id} style={styles.card}>
            <Text>#{log.id}</Text>
            <Text>{log.action}</Text>
            <Text>Actor: {log.actor_user_id ?? "-"}</Text>
            <Text>Target: {log.target_user_id ?? "-"}</Text>
            <Text>{log.created_at}</Text>
          </View>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" />
          <Text>Processing...</Text>
        </View>
      ) : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: mobileTheme.spacing.lg,
    gap: mobileTheme.spacing.lg,
    backgroundColor: mobileTheme.colors.background,
  },
  section: {
    backgroundColor: mobileTheme.colors.surface,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radius.md,
    padding: mobileTheme.spacing.md,
    gap: mobileTheme.spacing.sm,
  },
  sectionTitle: {
    fontSize: mobileTheme.font.sizes.section,
    color: mobileTheme.colors.textPrimary,
    fontWeight: mobileTheme.font.weights.bold,
  },
  input: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radius.sm,
    paddingHorizontal: 10,
    paddingVertical: mobileTheme.spacing.sm,
    color: mobileTheme.colors.textPrimary,
    backgroundColor: mobileTheme.colors.surface,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: mobileTheme.spacing.sm,
  },
  button: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderStrong,
    borderRadius: mobileTheme.radius.sm,
    paddingVertical: mobileTheme.spacing.sm,
    paddingHorizontal: 10,
    alignItems: "center",
    backgroundColor: mobileTheme.colors.surfaceMuted,
  },
  buttonText: {
    fontWeight: mobileTheme.font.weights.bold,
    color: mobileTheme.colors.textPrimary,
  },
  card: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radius.sm,
    padding: 10,
    gap: 2,
    backgroundColor: mobileTheme.colors.surface,
  },
  loadingRow: {
    flexDirection: "row",
    gap: mobileTheme.spacing.sm,
    alignItems: "center",
  },
  errorText: {
    fontWeight: mobileTheme.font.weights.semibold,
    color: mobileTheme.colors.danger,
  },
  title: {
    fontSize: mobileTheme.font.sizes.title,
    color: mobileTheme.colors.textPrimary,
    fontWeight: mobileTheme.font.weights.bold,
  },
});

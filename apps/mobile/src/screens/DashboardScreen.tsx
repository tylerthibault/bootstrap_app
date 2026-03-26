import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { mobileTheme } from "../theme/tokens";

type Profile = {
  id: number;
  email: string;
  display_name?: string | null;
  status: string;
  email_verified: boolean;
  roles: string[];
};

type Session = {
  id: number;
  device_id?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
  expires_at: string;
  is_active: boolean;
};

type ActivityItem = {
  id: number;
  action: string;
  route?: string | null;
  created_at: string;
};

type DashboardData = {
  profile: Profile | null;
  sessions: Session[];
  activity: ActivityItem[];
};

const DEFAULT_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:5299";
const DEFAULT_ACCESS_TOKEN = process.env.EXPO_PUBLIC_ACCESS_TOKEN ?? "";
const DEFAULT_REFRESH_TOKEN = process.env.EXPO_PUBLIC_REFRESH_TOKEN ?? "";

export function DashboardScreen() {
  const [apiBaseUrl, setApiBaseUrl] = useState(DEFAULT_API_BASE_URL);
  const [accessToken, setAccessToken] = useState(DEFAULT_ACCESS_TOKEN);
  const [refreshToken, setRefreshToken] = useState(DEFAULT_REFRESH_TOKEN);

  const [dashboard, setDashboard] = useState<DashboardData>({
    profile: null,
    sessions: [],
    activity: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionState, setActionState] = useState<"idle" | "logging-out-current" | "logging-out-all">("idle");

  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    }),
    [accessToken]
  );

  const loadDashboard = useCallback(async () => {
    if (!apiBaseUrl || !accessToken) {
      setError("API base URL and access token are required.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [profileResponse, sessionsResponse, activityResponse] = await Promise.all([
        fetch(`${apiBaseUrl}/api/users/me`, { headers }),
        fetch(`${apiBaseUrl}/api/sessions/me`, { headers }),
        fetch(`${apiBaseUrl}/api/logs/activity/recent?limit=10`, { headers }),
      ]);

      if (!profileResponse.ok || !sessionsResponse.ok || !activityResponse.ok) {
        throw new Error("Failed to load one or more dashboard resources.");
      }

      const [profileBody, sessionsBody, activityBody] = await Promise.all([
        profileResponse.json(),
        sessionsResponse.json(),
        activityResponse.json(),
      ]);

      setDashboard({
        profile: profileBody.data.profile,
        sessions: sessionsBody.data.sessions,
        activity: activityBody.data.activity,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error while loading dashboard.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, apiBaseUrl, headers]);

  const sendHeartbeat = useCallback(async () => {
    if (!apiBaseUrl || !accessToken) {
      return;
    }

    await fetch(`${apiBaseUrl}/api/logs/activity/heartbeat`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "heartbeat",
        route: "DashboardScreen",
        refresh_token: refreshToken || undefined,
        metadata: {
          source: "mobile-dashboard",
        },
      }),
    });
  }, [accessToken, apiBaseUrl, headers, refreshToken]);

  const logoutCurrentSession = useCallback(async () => {
    if (!apiBaseUrl || !accessToken || !refreshToken) {
      setError("API base URL, access token, and refresh token are required.");
      return;
    }

    setActionState("logging-out-current");
    setError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/api/sessions/current/logout`, {
        method: "POST",
        headers,
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!response.ok) {
        throw new Error("Failed to logout current session.");
      }
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error while logging out current session.");
    } finally {
      setActionState("idle");
    }
  }, [accessToken, apiBaseUrl, headers, loadDashboard, refreshToken]);

  const logoutAllSessions = useCallback(async () => {
    if (!apiBaseUrl || !accessToken) {
      setError("API base URL and access token are required.");
      return;
    }

    setActionState("logging-out-all");
    setError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/api/sessions/all/logout`, {
        method: "POST",
        headers,
      });
      if (!response.ok) {
        throw new Error("Failed to logout all sessions.");
      }
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error while logging out all sessions.");
    } finally {
      setActionState("idle");
    }
  }, [accessToken, apiBaseUrl, headers, loadDashboard]);

  useEffect(() => {
    if (!apiBaseUrl || !accessToken) {
      return;
    }

    void sendHeartbeat();
    const intervalId = setInterval(() => {
      void sendHeartbeat();
    }, 60_000);

    return () => {
      clearInterval(intervalId);
    };
  }, [accessToken, apiBaseUrl, sendHeartbeat]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Dashboard</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>API Config</Text>
        <TextInput style={styles.input} value={apiBaseUrl} onChangeText={setApiBaseUrl} autoCapitalize="none" placeholder="API Base URL" />
        <TextInput style={styles.input} value={accessToken} onChangeText={setAccessToken} autoCapitalize="none" placeholder="Access Token" />
        <TextInput style={styles.input} value={refreshToken} onChangeText={setRefreshToken} autoCapitalize="none" placeholder="Refresh Token" />
        <Pressable style={styles.button} onPress={loadDashboard}>
          <Text style={styles.buttonText}>Load Dashboard</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={() => void sendHeartbeat()}>
          <Text style={styles.buttonText}>Send Heartbeat</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" />
          <Text>Loading dashboard...</Text>
        </View>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile</Text>
        {dashboard.profile ? (
          <>
            <Text>ID: {dashboard.profile.id}</Text>
            <Text>Email: {dashboard.profile.email}</Text>
            <Text>Name: {dashboard.profile.display_name ?? "-"}</Text>
            <Text>Status: {dashboard.profile.status}</Text>
            <Text>Email Verified: {dashboard.profile.email_verified ? "Yes" : "No"}</Text>
            <Text>Roles: {dashboard.profile.roles.join(", ") || "-"}</Text>
          </>
        ) : (
          <Text>No profile loaded.</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Sessions</Text>
        {dashboard.sessions.length > 0 ? (
          dashboard.sessions.map((session) => (
            <View key={session.id} style={styles.card}>
              <Text>Session #{session.id}</Text>
              <Text>Active: {session.is_active ? "Yes" : "No"}</Text>
              <Text>Device: {session.device_id ?? "unknown"}</Text>
              <Text>IP: {session.ip_address ?? "unknown"}</Text>
              <Text>Created: {session.created_at}</Text>
              <Text>Expires: {session.expires_at}</Text>
            </View>
          ))
        ) : (
          <Text>No sessions found.</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {dashboard.activity.length > 0 ? (
          dashboard.activity.map((item) => (
            <View key={item.id} style={styles.card}>
              <Text>{item.action}</Text>
              <Text>{item.route ?? "-"}</Text>
              <Text>{item.created_at}</Text>
            </View>
          ))
        ) : (
          <Text>No activity found.</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Actions</Text>
        <Pressable style={styles.button} onPress={logoutCurrentSession} disabled={actionState !== "idle"}>
          <Text style={styles.buttonText}>{actionState === "logging-out-current" ? "Logging Out..." : "Logout Current Session"}</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={logoutAllSessions} disabled={actionState !== "idle"}>
          <Text style={styles.buttonText}>{actionState === "logging-out-all" ? "Logging Out..." : "Logout All Sessions"}</Text>
        </Pressable>
      </View>
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
    gap: mobileTheme.spacing.sm,
    padding: mobileTheme.spacing.md,
    backgroundColor: mobileTheme.colors.surface,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radius.md,
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
  button: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: mobileTheme.radius.sm,
    alignItems: "center",
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderStrong,
    backgroundColor: mobileTheme.colors.surfaceMuted,
  },
  buttonText: {
    fontWeight: mobileTheme.font.weights.bold,
    color: mobileTheme.colors.textPrimary,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: mobileTheme.spacing.sm,
  },
  errorText: {
    fontWeight: mobileTheme.font.weights.semibold,
    color: mobileTheme.colors.danger,
  },
  card: {
    gap: 2,
    padding: mobileTheme.spacing.lg,
    borderRadius: mobileTheme.radius.sm,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    backgroundColor: mobileTheme.colors.surface,
  },
  title: {
    fontSize: mobileTheme.font.sizes.title,
    color: mobileTheme.colors.textPrimary,
    fontWeight: mobileTheme.font.weights.bold,
  },
});

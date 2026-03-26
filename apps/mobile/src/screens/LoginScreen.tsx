import { useMemo, useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { RootStackParamList } from "../navigation/RootNavigator";
import { mobileTheme } from "../theme/tokens";

type LoginScreenProps = NativeStackScreenProps<RootStackParamList, "Login">;

const DEFAULT_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:5299";

type LoginResponseData = {
  user?: {
    id: number;
    email: string;
    display_name?: string | null;
  };
  tokens?: {
    access_token?: string;
    refresh_token?: string;
  };
};

async function parseApiResponse(response: Response) {
  const rawBody = await response.text();
  try {
    return JSON.parse(rawBody) as { ok?: boolean; data?: LoginResponseData; error?: { message?: string } };
  } catch {
    throw new Error(
      `Request failed with non-JSON response (status ${response.status}). Check API URL/server.`,
    );
  }
}

export function LoginScreen({ navigation }: LoginScreenProps) {
  const [apiBaseUrl, setApiBaseUrl] = useState(DEFAULT_API_BASE_URL);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [authData, setAuthData] = useState<LoginResponseData | null>(null);

  const canSubmit = useMemo(() => {
    return Boolean(apiBaseUrl.trim() && email.trim() && password.trim());
  }, [apiBaseUrl, email, password]);

  const submitLogin = async () => {
    if (!canSubmit) {
      setError("API base URL, email, and password are required.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`${apiBaseUrl.trim()}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const body = await parseApiResponse(response);
      if (!response.ok || !body?.ok) {
        const apiMessage = body?.error?.message;
        throw new Error(apiMessage || "Login failed.");
      }

      setAuthData(body.data ?? null);
      setSuccessMessage("Login successful. Tokens loaded below.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unexpected login error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Login</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Credentials</Text>
        <TextInput
          style={styles.input}
          value={apiBaseUrl}
          onChangeText={setApiBaseUrl}
          autoCapitalize="none"
          placeholder="API Base URL"
        />
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Email"
        />
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Password"
        />

        <Pressable style={styles.button} onPress={() => void submitLogin()} disabled={!canSubmit || loading}>
          <Text style={styles.buttonText}>{loading ? "Signing In..." : "Sign In"}</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" />
          <Text>Processing...</Text>
        </View>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

      {authData ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session</Text>
          <Text>User: {authData.user?.email ?? "-"}</Text>
          <Text selectable>Access Token: {authData.tokens?.access_token ?? "-"}</Text>
          <Text selectable>Refresh Token: {authData.tokens?.refresh_token ?? "-"}</Text>

          <Pressable style={styles.button} onPress={() => navigation.navigate("Dashboard")}>
            <Text style={styles.buttonText}>Go To Dashboard</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text>Need an account?</Text>
        <Pressable style={styles.button} onPress={() => navigation.navigate("Register")}>
          <Text style={styles.buttonText}>Go To Register</Text>
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
  button: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderStrong,
    borderRadius: mobileTheme.radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
    backgroundColor: mobileTheme.colors.surfaceMuted,
  },
  buttonText: {
    fontWeight: mobileTheme.font.weights.bold,
    color: mobileTheme.colors.textPrimary,
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
  successText: {
    fontWeight: mobileTheme.font.weights.semibold,
    color: mobileTheme.colors.success,
  },
  title: {
    fontSize: mobileTheme.font.sizes.title,
    color: mobileTheme.colors.textPrimary,
    fontWeight: mobileTheme.font.weights.bold,
  },
});

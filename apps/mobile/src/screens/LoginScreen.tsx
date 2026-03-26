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
  const [apiBaseUrl] = useState(DEFAULT_API_BASE_URL);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return Boolean(email.trim() && password.trim());
  }, [email, password]);

  const submitLogin = async () => {
    if (!canSubmit) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    setError(null);

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
        throw new Error(apiMessage || "Login failed. Check your credentials and try again.");
      }

      navigation.replace("Dashboard", {
        apiBaseUrl: apiBaseUrl.trim(),
        accessToken: body.data?.tokens?.access_token ?? "",
        refreshToken: body.data?.tokens?.refresh_token ?? "",
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unexpected login error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to your account to continue.</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Email address</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
            placeholderTextColor={mobileTheme.colors.textMuted}
            autoComplete="email"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholder="••••••••"
              placeholderTextColor={mobileTheme.colors.textMuted}
              autoComplete="current-password"
            />
            <Pressable style={styles.toggleBtn} onPress={() => setShowPassword((v) => !v)}>
              <Text style={styles.toggleBtnText}>{showPassword ? "Hide" : "Show"}</Text>
            </Pressable>
          </View>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Pressable
          style={[styles.primaryButton, (!canSubmit || loading) && styles.buttonDisabled]}
          onPress={() => void submitLogin()}
          disabled={!canSubmit || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={mobileTheme.colors.brandContrast} />
          ) : (
            <Text style={styles.primaryButtonText}>Sign in</Text>
          )}
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Don&apos;t have an account? </Text>
        <Pressable onPress={() => navigation.navigate("Register")}>
          <Text style={styles.linkText}>Create one</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: mobileTheme.spacing.xl,
    gap: mobileTheme.spacing.xl,
    backgroundColor: mobileTheme.colors.background,
    justifyContent: "center",
  },
  header: {
    gap: mobileTheme.spacing.xs,
  },
  title: {
    fontSize: mobileTheme.font.sizes.title,
    color: mobileTheme.colors.textPrimary,
    fontWeight: mobileTheme.font.weights.bold,
  },
  subtitle: {
    fontSize: mobileTheme.font.sizes.body,
    color: mobileTheme.colors.textSecondary,
  },
  card: {
    backgroundColor: mobileTheme.colors.surface,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radius.lg,
    padding: mobileTheme.spacing.xl,
    gap: mobileTheme.spacing.lg,
  },
  fieldGroup: {
    gap: mobileTheme.spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: mobileTheme.font.weights.semibold,
    color: mobileTheme.colors.textPrimary,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: mobileTheme.spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: mobileTheme.font.sizes.body,
    color: mobileTheme.colors.textPrimary,
    backgroundColor: mobileTheme.colors.surface,
  },
  toggleBtn: {
    paddingHorizontal: mobileTheme.spacing.sm,
    paddingVertical: 10,
  },
  toggleBtnText: {
    fontSize: 13,
    color: mobileTheme.colors.textMuted,
    fontWeight: mobileTheme.font.weights.medium,
  },
  errorBox: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: mobileTheme.radius.sm,
    padding: mobileTheme.spacing.md,
  },
  errorText: {
    color: mobileTheme.colors.danger,
    fontSize: 14,
    fontWeight: mobileTheme.font.weights.medium,
  },
  primaryButton: {
    backgroundColor: mobileTheme.colors.brand,
    borderRadius: mobileTheme.radius.sm,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  primaryButtonText: {
    color: mobileTheme.colors.brandContrast,
    fontWeight: mobileTheme.font.weights.bold,
    fontSize: mobileTheme.font.sizes.body,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: mobileTheme.colors.textMuted,
  },
  linkText: {
    fontSize: 14,
    color: mobileTheme.colors.brand,
    fontWeight: mobileTheme.font.weights.medium,
  },
});


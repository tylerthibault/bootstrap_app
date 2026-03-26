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

type RegisterScreenProps = NativeStackScreenProps<RootStackParamList, "Register">;

const DEFAULT_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:5299";

type RegisterResponseData = {
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
    return JSON.parse(rawBody) as { ok?: boolean; data?: RegisterResponseData; error?: { message?: string } };
  } catch {
    throw new Error(
      `Request failed with non-JSON response (status ${response.status}). Check API URL/server.`,
    );
  }
}

function getPasswordStrength(password: string): { label: string; color: string } | null {
  if (!password) return null;
  if (password.length < 8) return { label: "Too short (min 8 characters)", color: mobileTheme.colors.danger };
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const strength = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
  if (strength <= 2) return { label: "Weak", color: "#d97706" };
  if (strength === 3) return { label: "Good", color: mobileTheme.colors.brand };
  return { label: "Strong", color: mobileTheme.colors.success };
}

export function RegisterScreen({ navigation }: RegisterScreenProps) {
  const [apiBaseUrl] = useState(DEFAULT_API_BASE_URL);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordStrength = getPasswordStrength(password);
  const passwordsMatch = !confirmPassword || password === confirmPassword;

  const canSubmit = useMemo(() => {
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      return false;
    }
    if (password !== confirmPassword) {
      return false;
    }
    return password.length >= 8;
  }, [confirmPassword, email, password]);

  const submitRegistration = async () => {
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError("Email, password, and confirm password are required.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiBaseUrl.trim()}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          display_name: displayName.trim() || undefined,
        }),
      });

      const body = await parseApiResponse(response);
      if (!response.ok || !body?.ok) {
        const apiMessage = body?.error?.message;
        throw new Error(apiMessage || "Registration failed.");
      }

      navigation.replace("Dashboard", {
        apiBaseUrl: apiBaseUrl.trim(),
        accessToken: body.data?.tokens?.access_token ?? "",
        refreshToken: body.data?.tokens?.refresh_token ?? "",
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unexpected registration error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.title}>Create an account</Text>
        <Text style={styles.subtitle}>Get started — it only takes a moment.</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            Name <Text style={styles.optionalLabel}>(optional)</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your name"
            placeholderTextColor={mobileTheme.colors.textMuted}
            autoComplete="name"
          />
        </View>

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
              placeholder="Minimum 8 characters"
              placeholderTextColor={mobileTheme.colors.textMuted}
              autoComplete="new-password"
            />
            <Pressable style={styles.toggleBtn} onPress={() => setShowPassword((v) => !v)}>
              <Text style={styles.toggleBtnText}>{showPassword ? "Hide" : "Show"}</Text>
            </Pressable>
          </View>
          {passwordStrength ? (
            <Text style={[styles.strengthText, { color: passwordStrength.color }]}>{passwordStrength.label}</Text>
          ) : null}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Confirm password</Text>
          <TextInput
            style={[styles.input, confirmPassword && !passwordsMatch ? styles.inputError : undefined]}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showPassword}
            placeholder="Re-enter your password"
            placeholderTextColor={mobileTheme.colors.textMuted}
            autoComplete="new-password"
          />
          {confirmPassword && !passwordsMatch ? (
            <Text style={styles.fieldErrorText}>Passwords do not match</Text>
          ) : null}
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Pressable
          style={[styles.primaryButton, (!canSubmit || loading) && styles.buttonDisabled]}
          onPress={() => void submitRegistration()}
          disabled={!canSubmit || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={mobileTheme.colors.brandContrast} />
          ) : (
            <Text style={styles.primaryButtonText}>Create account</Text>
          )}
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <Pressable onPress={() => navigation.navigate("Login")}>
          <Text style={styles.linkText}>Sign in</Text>
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
  optionalLabel: {
    fontWeight: mobileTheme.font.weights.regular,
    color: mobileTheme.colors.textMuted,
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
  inputError: {
    borderColor: mobileTheme.colors.danger,
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
  strengthText: {
    fontSize: 13,
    fontWeight: mobileTheme.font.weights.medium,
  },
  fieldErrorText: {
    fontSize: 13,
    color: mobileTheme.colors.danger,
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


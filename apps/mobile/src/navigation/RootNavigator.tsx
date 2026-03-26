import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useEffect } from "react";
import { Text, View } from "react-native";
import { mobileTheme } from "../theme/tokens";
import { AdminDashboardScreen } from "../screens/AdminDashboardScreen";
import { DashboardScreen } from "../screens/DashboardScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { RegisterScreen } from "../screens/RegisterScreen";

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Dashboard: {
    apiBaseUrl?: string;
    accessToken?: string;
    refreshToken?: string;
  } | undefined;
  AdminDashboard: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

type AppRole = "user" | "admin";

function resolveAppRole(): AppRole {
  return process.env.EXPO_PUBLIC_APP_ROLE === "admin" ? "admin" : "user";
}

function AdminRouteGuard() {
  useEffect(() => {
    console.warn("Admin route denied: admin role required");
  }, []);

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: mobileTheme.spacing.lg,
        gap: mobileTheme.spacing.sm,
        backgroundColor: mobileTheme.colors.background,
      }}
    >
      <Text style={{ fontSize: mobileTheme.font.sizes.title, fontWeight: mobileTheme.font.weights.bold, color: mobileTheme.colors.textPrimary }}>
        Forbidden
      </Text>
      <Text style={{ color: mobileTheme.colors.textSecondary }}>Admin access is required for this route.</Text>
    </View>
  );
}

export function RootNavigator() {
  const role = resolveAppRole();

  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen
        name="AdminDashboard"
        component={role === "admin" ? AdminDashboardScreen : AdminRouteGuard}
        options={{ title: "Admin Dashboard" }}
      />
    </Stack.Navigator>
  );
}

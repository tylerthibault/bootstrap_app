import { StyleSheet, Text, View } from "react-native";

export function AdminDashboardScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Dashboard</Text>
      <Text>Placeholder screen for admin controls and audit views.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 8
  },
  title: {
    fontSize: 24,
    fontWeight: "700"
  }
});

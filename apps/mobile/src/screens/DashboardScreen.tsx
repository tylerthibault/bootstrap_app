import { StyleSheet, Text, View } from "react-native";

export function DashboardScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Text>Placeholder screen for authenticated user dashboard.</Text>
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

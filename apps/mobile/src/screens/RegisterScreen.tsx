import { StyleSheet, Text, View } from "react-native";

export function RegisterScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>
      <Text>Placeholder screen for user registration flow.</Text>
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

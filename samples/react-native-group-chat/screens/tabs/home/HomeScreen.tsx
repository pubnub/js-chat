import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

const AppButton = ({ onPress, title }) => (
  <TouchableOpacity onPress={onPress} style={styles.appButtonContainer}>
    <Text style={styles.appButtonText}>{title}</Text>
  </TouchableOpacity>
);

export function HomeScreen({ navigation, route }) {
  return (
    <View>
      <Text>Home screen</Text>
      <Text>
        You are logged in as {route.params.name}
      </Text>
      <AppButton title="Go to the chat screen" size="sm" backgroundColor="#007bff" onPress={() => navigation.navigate("Chat")} />
    </View>
  )
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 16
  },
  appButtonContainer: {
    elevation: 8,
    backgroundColor: "#009688",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12
  },
  appButtonText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
    alignSelf: "center",
    textTransform: "uppercase"
  }
});

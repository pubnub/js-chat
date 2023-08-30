import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet } from "react-native";
import { RootStackParamList } from "../../../types"
import { NativeStackScreenProps } from "@react-navigation/native-stack";

export function LoginScreen({ navigation }: NativeStackScreenProps<RootStackParamList, "login">) {
  const [name, setName] = useState("test-user")

  return (
    <View>
      <Text>Your name</Text>
      <TextInput value={name} onChangeText={setName} style={styles.input} />
      <Button title="log in" onPress={() => navigation.navigate("tabs", { name })} />
    </View>
  )
}

const styles = StyleSheet.create({
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
  },
});

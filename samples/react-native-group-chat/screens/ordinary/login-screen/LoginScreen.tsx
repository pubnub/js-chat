import React, { useState } from "react"
import { View, StyleSheet } from "react-native"
import { RootStackParamList } from "../../../types"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { Text, Button, Gap, TextInput, colorPalette as colors } from "../../../ui-components"
import ChatIcon from "../../../assets/chat.svg"

export function LoginScreen({ navigation }: NativeStackScreenProps<RootStackParamList, "login">) {
  const [name, setName] = useState("test-user")

  return (
    <View style={styles.container}>
      <ChatIcon style={{ alignSelf: "center" }} />
      <Gap value={16} />

      <Text variant="headline" textAlign="center">
        Log in to Sample Chat App
      </Text>
      <Gap value={12} />

      <Text variant="body" color="neutral600" textAlign="center">
        Built with PubNub Chat SDK for JavaScript and TypeScript.
      </Text>
      <Gap value={96} />

      <TextInput label="User ID" value={name} onChangeText={setName} />
      <Gap value={96} />

      <Button size="md" onPress={() => navigation.navigate("tabs", { name })}>
        Log in
      </Button>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.neutral0,
    flex: 1,
    alignItems: "stretch",
    justifyContent: "center",
    padding: 32,
  },
})

import React, { useState } from "react"
import { View, StyleSheet } from "react-native"
import { StackScreenProps } from "@react-navigation/stack"

import { Text, Button, Gap, TextInput, colorPalette as colors } from "../../../ui-components"
import { RootStackParamList } from "../../../types"
import ChatIcon from "../../../assets/chat.svg"

export function LoginScreen({ navigation }: StackScreenProps<RootStackParamList, "login">) {
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

      <Button size="sm" onPress={() => navigation.replace("tabs", { name })}>
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

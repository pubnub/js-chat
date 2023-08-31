import React, { useContext } from "react"
import { View, Text, Button } from "react-native"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { BottomTabsParamList } from "../../../types"
import { ChatContext } from "../../../context"

export function ProfileScreen({
  navigation,
}: NativeStackScreenProps<BottomTabsParamList, "Profile">) {
  const { chat } = useContext(ChatContext)

  const logout = () => {
    navigation.pop()
  }

  return (
    <View>
      <Text>Profile screen</Text>
      <Text>You are logged in as {chat?.currentUser.id}</Text>
      <Button title="Logout" onPress={logout} />
    </View>
  )
}

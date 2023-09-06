import React, { useContext, useState } from "react"
import { View, StyleSheet } from "react-native"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { BottomTabsParamList } from "../../../types"
import { ChatContext } from "../../../context"
import { Switch, Button } from "react-native-paper"
import { usePNTheme } from "../../../ui-components/defaultTheme"
import { RandomAvatar } from "../../../ui-components/random-avatar"
import { Text } from "../../../ui-components/text"
import { Gap } from "../../../ui-components/gap"

export function ProfileScreen({
  navigation,
}: NativeStackScreenProps<BottomTabsParamList, "Profile">) {
  const { chat, setMemberships, setChat } = useContext(ChatContext)
  const [notifications, setNotifications] = useState(true)
  const [receipts, setReceipts] = useState(true)
  const theme = usePNTheme()

  const logout = () => {
    navigation.pop()
    setChat(null)
    setMemberships([])
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.neutral0 }]}>
      <View style={styles.row}>
        <RandomAvatar size={88} />
      </View>

      <View style={styles.row}>
        <View style={styles.flex}>
          <Text variant="headline" fontFamily="Roboto-Regular">
            Name
          </Text>
          <Text variant="headline">{chat?.currentUser.name || chat?.currentUser.id}</Text>
        </View>
        <Button
          mode="outlined"
          style={[styles.button]}
          textColor={theme.colors.navy700}
          onPress={() => alert("TODO")}
        >
          Change
        </Button>
      </View>

      <View style={styles.hr} />

      <View style={styles.row}>
        <View style={styles.flex}>
          <Text variant="headline" fontFamily="Roboto-Regular">
            Notifications
          </Text>
          <Gap value={8} />
          <Text variant="body">Get notified about new messages and mentions from chats</Text>
        </View>
        <Switch value={notifications} onValueChange={setNotifications} />
      </View>

      <View style={styles.hr} />

      <View style={styles.row}>
        <View style={styles.flex}>
          <Text variant="headline" fontFamily="Roboto-Regular">
            Read receipts
          </Text>
          <Gap value={8} />
          <Text variant="body">You will see send or receive receipts</Text>
        </View>
        <Switch value={receipts} onValueChange={setReceipts} />
      </View>

      <View style={styles.row}>
        <Button mode="outlined" style={styles.button} onPress={logout}>
          Logout
        </Button>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 32,
  },
  row: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 25,
  },
  hr: {
    borderBottomColor: "#E2E8F0",
    borderBottomWidth: 1,
  },
  flex: {
    flex: 1,
    paddingRight: 50,
  },
  button: {
    borderColor: "#CBD5E1",
    borderWidth: 2,
    borderRadius: 6,
    width: 120,
  },
})

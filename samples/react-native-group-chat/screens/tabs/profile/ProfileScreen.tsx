import React, { useContext, useState } from "react"
import { View, Text, StyleSheet } from "react-native"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { BottomTabsParamList } from "../../../types"
import { ChatContext } from "../../../context"
import { Avatar, Switch, Button } from "react-native-paper"

export function ProfileScreen({
  navigation,
}: NativeStackScreenProps<BottomTabsParamList, "Profile">) {
  const { chat } = useContext(ChatContext)
  const [notifications, setNotifications] = useState(true)
  const [receipts, setReceipts] = useState(true)

  const logout = () => {
    navigation.pop()
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Avatar.Image
          size={88}
          style={styles.avatar}
          source={{ uri: `https://loremflickr.com/88/88?random=${chat?.currentUser.id}` }}
        />
      </View>

      <View style={styles.row}>
        <View style={styles.flex}>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.name}>{chat?.currentUser.name || chat?.currentUser.id}</Text>
        </View>
        <Button mode="outlined" style={styles.button} onPress={() => alert("TODO")}>
          Change
        </Button>
      </View>

      <View style={styles.hr} />

      <View style={styles.row}>
        <View style={styles.flex}>
          <Text style={styles.label}>Notifications</Text>
          <Text style={styles.description}>
            Get notified about new messages and mentions from chats
          </Text>
        </View>
        <Switch value={notifications} onValueChange={setNotifications} />
      </View>

      <View style={styles.hr} />

      <View style={styles.row}>
        <View style={styles.flex}>
          <Text style={styles.label}>Read receipts</Text>
          <Text style={styles.description}>You will see send or receive receipts</Text>
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
    backgroundColor: "#ffffff",
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
  label: {
    fontSize: 18,
    lineHeight: 28,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    lineHeight: 28,
  },
  description: {
    color: "#525252",
    fontSize: 16,
    lineHeight: 24,
    marginTop: 8,
  },
  button: {
    borderColor: "#CBD5E1",
    borderWidth: 2,
    borderRadius: 6,
    width: 120,
  },
})

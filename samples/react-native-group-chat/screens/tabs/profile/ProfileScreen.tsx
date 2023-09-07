import React, { useContext, useState, useRef } from "react"
import { View, StyleSheet } from "react-native"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { BottomTabsParamList } from "../../../types"
import { ChatContext } from "../../../context"
import { Switch } from "react-native-paper"
import { usePNTheme } from "../../../ui-components/defaultTheme"
import { BottomSheetModal, BottomSheetBackdrop } from "@gorhom/bottom-sheet"
import { Line, Button, Text, Gap, RandomAvatar } from "../../../ui-components"

export function ProfileScreen({
  navigation,
}: NativeStackScreenProps<BottomTabsParamList, "Profile">) {
  const { chat, setMemberships, setChat } = useContext(ChatContext)
  const bottomSheetModalRef = useRef<BottomSheetModal>(null)
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
      <Gap value={24} />

      <View style={{ alignItems: "center" }}>
        <RandomAvatar size={88} />
      </View>

      <Gap value={24} />

      <View style={styles.row}>
        <View>
          <Text variant="headline" fontFamily="Roboto-Regular">
            Name
          </Text>
          <Text variant="headline">{chat?.currentUser.name || chat?.currentUser.id}</Text>
        </View>

        <Button variant="outlined" size="sm" onPress={() => alert("TODO")} style={{ width: 120 }}>
          Change
        </Button>
      </View>

      <Gap value={24} />
      <Line />
      <Gap value={24} />

      <View style={styles.row}>
        <Text variant="headline" fontFamily="Roboto-Regular">
          Notifications
        </Text>
        <Switch value={notifications} onValueChange={setNotifications} />
      </View>
      <Gap value={12} />
      <Text variant="body" color="neutral600">
        Get notified about new messages and mentions from chats
      </Text>

      <Gap value={24} />
      <Line />
      <Gap value={24} />

      <View style={styles.row}>
        <Text variant="headline" fontFamily="Roboto-Regular">
          Read receipts
        </Text>
        <Switch value={receipts} onValueChange={setReceipts} />
      </View>
      <Gap value={12} />
      <Text variant="body" color="neutral600">
        You will see send or receive receipts
      </Text>

      <Gap value={24} />
      <Line />
      <Gap value={24} />

      <Button variant="danger" size="md" onPress={logout} icon="logout" align="left">
        Logout
      </Button>

      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={1}
        snapPoints={["25%", "50%"]}
        backdropComponent={BottomSheetBackdrop}
      >
        <Text>Hello</Text>
      </BottomSheetModal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 32,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    justifySelf: "center",
  },
  button: {
    borderColor: "#CBD5E1",
    borderWidth: 2,
    borderRadius: 6,
    width: 120,
  },
})

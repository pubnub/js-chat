import React, { useContext, useState, useRef } from "react"
import { View, StyleSheet, Switch } from "react-native"
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs"
import { BottomSheetModal, BottomSheetBackdrop } from "@gorhom/bottom-sheet"

import { BottomTabsParamList } from "../../../types"
import { ChatContext } from "../../../context"
import { Line, Button, Text, Gap, TextInput, colorPalette as colors } from "../../../ui-components"
import { Avatar } from "../../../components"

export function ProfileScreen({
  navigation,
}: BottomTabScreenProps<BottomTabsParamList, "Profile">) {
  const { chat, setMemberships, setChat } = useContext(ChatContext)
  const bottomSheetModalRef = useRef<BottomSheetModal>(null)
  const [notifications, setNotifications] = useState(true)
  const [receipts, setReceipts] = useState(true)
  const [userName, setUserName] = useState(chat?.currentUser.name)
  const [nameInput, setNameInput] = useState(userName)

  const logout = () => {
    // TODO: fix navigation type error
    navigation.replace("login")
    setChat(null)
    setMemberships([])
  }

  const saveName = async () => {
    await chat?.currentUser.update({ name: nameInput })
    // TODO: this should ideally stream remote updates to confirm the change instead
    // however, there doesn't seem to be a way to update chat.currentUser in the SDK
    setUserName(nameInput)
    bottomSheetModalRef.current?.dismiss()
  }

  return (
    chat?.currentUser && (
      <View style={styles.container}>
        <View style={{ alignItems: "center" }}>
          <Avatar source={chat?.currentUser} size="xl" />
        </View>

        <Gap value={24} />

        <View style={styles.row}>
          <View>
            <Text variant="headline" fontFamily="Roboto_400Regular">
              Name
            </Text>
            <Text variant="headline">{userName}</Text>
          </View>

          <Button
            variant="outlined"
            size="md"
            onPress={() => bottomSheetModalRef.current?.present()}
            style={{ width: 120 }}
          >
            Change
          </Button>
        </View>

        <Gap value={24} />
        <Line />
        <Gap value={24} />

        <View style={styles.row}>
          <Text variant="headline" fontFamily="Roboto_400Regular">
            Notifications
          </Text>
          <Switch
            disabled
            trackColor={{ true: colors.neutral900 }}
            value={notifications}
            onValueChange={setNotifications}
          />
        </View>

        <Gap value={12} />

        <Text variant="body" color="neutral600">
          Get notified about new messages and mentions from chats
        </Text>

        <Gap value={24} />
        <Line />
        <Gap value={24} />

        <View style={styles.row}>
          <Text variant="headline" fontFamily="Roboto_400Regular">
            Read receipts
          </Text>
          <Switch
            disabled
            trackColor={{ true: colors.neutral900 }}
            value={receipts}
            onValueChange={setReceipts}
          />
        </View>

        <Gap value={12} />

        <Text variant="body" color="neutral600">
          You will see send or receive receipts
        </Text>

        <Gap value={24} />
        <Line />
        <Gap value={24} />

        <Button variant="danger" size="lg" onPress={logout} icon="logout" align="left">
          Logout
        </Button>

        <BottomSheetModal
          ref={bottomSheetModalRef}
          index={1}
          snapPoints={["25%", "50%"]}
          backdropComponent={BottomSheetBackdrop}
          style={styles.container}
        >
          <Gap value={24} />
          <Text variant="headline" textAlign="center">
            Change your name
          </Text>
          <Gap value={36} />
          <TextInput label="Name" value={nameInput} onChangeText={setNameInput} />
          <Gap value={36} />
          <Button onPress={saveName}>Save</Button>
          <Gap value={16} />
          <Button variant="outlined" onPress={() => bottomSheetModalRef.current?.dismiss()}>
            Cancel
          </Button>
        </BottomSheetModal>
      </View>
    )
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.neutral0,
    flex: 1,
    padding: 32,
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

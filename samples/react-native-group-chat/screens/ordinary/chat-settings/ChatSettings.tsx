import { useState, useContext, useEffect, useRef } from "react"
import { View, ScrollView, StyleSheet } from "react-native"
import { StackScreenProps } from "@react-navigation/stack"
import { BottomSheetModal, BottomSheetBackdrop } from "@gorhom/bottom-sheet"

import { HomeStackParamList } from "../../../types"
import { ChatContext } from "../../../context"
import { Gap, Button, Line, Text, TextInput, colorPalette as colors } from "../../../ui-components"
import { Avatar } from "../../../components"

export function ChatSettings({ navigation }: StackScreenProps<HomeStackParamList, "ChatSettings">) {
  const { chat, currentChannel, setCurrentChannel, currentChannelMembers } = useContext(ChatContext)
  const isDirect = currentChannel?.type === "direct"
  const bottomSheetModalRef = useRef<BottomSheetModal>(null)
  const [nameInput, setNameInput] = useState(currentChannel?.name)
  const members = currentChannelMembers
    .filter((m) => m.user.id !== chat?.currentUser.id)
    .map((m) => m.user)

  async function leaveOrRemove() {
    if (!currentChannel) return
    isDirect ? await currentChannel.delete() : await currentChannel.leave()
    navigation.popToTop()
  }

  async function saveName() {
    if (!currentChannel) return
    await currentChannel.update({ name: nameInput })
    bottomSheetModalRef.current?.dismiss()
  }

  useEffect(() => {
    if (!currentChannel) return
    return currentChannel.streamUpdates(setCurrentChannel)
  }, [currentChannel, setCurrentChannel])

  return (
    currentChannel && (
      <ScrollView style={styles.container}>
        <View style={styles.avatars}>
          {members.map((user) => (
            <Avatar
              source={user}
              style={styles.avatar}
              key={user.id}
              size="lg"
              showIndicator={isDirect}
            />
          ))}
        </View>

        {!isDirect && (
          <>
            <View style={styles.row}>
              <View>
                <Text variant="headline" fontFamily="Roboto_400Regular">
                  Name
                </Text>
                <Text variant="headline">{currentChannel.name}</Text>
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
          </>
        )}

        <Text variant="headline" fontFamily="Roboto_400Regular">
          Members
        </Text>
        <Gap value={4} />
        {members.map((user) => (
          <Text variant="headline" key={user.id}>
            {user.name || user.id}
          </Text>
        ))}

        <Gap value={24} />
        <Line />
        <Gap value={24} />

        <Button
          variant="danger"
          icon={isDirect ? undefined : "logout"}
          iconCommunity={isDirect ? "trash-can-outline" : undefined}
          align="left"
          onPress={leaveOrRemove}
        >
          {isDirect ? "Delete conversation" : "Leave conversation"}
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
            Change chat name
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
      </ScrollView>
    )
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.neutral0,
    flex: 1,
    paddingHorizontal: 32,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    justifySelf: "center",
  },
  avatars: {
    flexDirection: "row",
    margin: 32,
    justifyContent: "center",
  },
  avatar: {
    borderWidth: 2,
    borderColor: colors.neutral0,
    borderRadius: 100,
    marginLeft: -12,
  },
})

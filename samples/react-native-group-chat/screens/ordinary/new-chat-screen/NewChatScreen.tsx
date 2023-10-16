import { useState, useContext } from "react"
import { View, StyleSheet, FlatList } from "react-native"
import { StackScreenProps } from "@react-navigation/stack"
import { User } from "@pubnub/chat"

import { Gap, Button, Line, TextInput, colorPalette as colors } from "../../../ui-components"
import { ListItem, Avatar } from "../../../components"
import { HomeStackParamList } from "../../../types"
import { ChatContext } from "../../../context"

export function NewChatScreen({ navigation }: StackScreenProps<HomeStackParamList, "NewChat">) {
  const { chat, users, setLoading, setCurrentChannel } = useContext(ChatContext)
  const [searchText, setSearchText] = useState("")

  async function openChat(user: User) {
    if (!chat) return
    setLoading(true)
    navigation.popToTop()
    navigation.navigate("Chat")
    const { channel } = await chat.createDirectConversation({
      user,
      channelData: { name: `1:1 with ${user.name}` },
    })
    await chat.emitEvent({
      channel: user.id,
      method: "publish",
      payload: {
        action: "DIRECT_CONVERSATION_STARTED",
        channelId: channel.id,
      },
    })
    setCurrentChannel(channel)
    setLoading(false)
  }

  return (
    <View style={styles.container}>
      <TextInput
        onChangeText={setSearchText}
        value={searchText}
        placeholder="Search"
        icon="search"
        variant="search"
      />

      <Gap value={20} />

      <Button
        icon="people-outline"
        size="md"
        variant="outlined"
        onPress={() => navigation.navigate("NewGroup")}
      >
        Create group chat
      </Button>

      <Gap value={20} />
      <Line />
      <Gap value={20} />

      <FlatList
        data={users.filter((user) => user.name?.toLowerCase().includes(searchText.toLowerCase()))}
        renderItem={({ item: user }) => (
          <ListItem
            avatar={<Avatar source={user} showIndicator />}
            title={user.name || user.id}
            onPress={() => openChat(user)}
          />
        )}
        keyExtractor={(user) => user.id}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.neutral0,
    padding: 16,
    flex: 1,
  },
})

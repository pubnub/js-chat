import { useState, useContext } from "react"
import { View, StyleSheet, FlatList } from "react-native"
import { StackScreenProps } from "@react-navigation/stack"
import { User } from "@pubnub/chat"

import { HomeStackParamList } from "../../../types"
import { ChatContext } from "../../../context"
import { ListItem } from "../../../components"
import { Gap, Button, Line, TextInput, colorPalette as colors } from "../../../ui-components"

export function NewChatScreen({ navigation }: StackScreenProps<HomeStackParamList, "NewChat">) {
  const [searchText, setSearchText] = useState("")
  const { chat, users } = useContext(ChatContext)

  async function openChat(user: User) {
    // TODO: this should ideally navigate first and create channel in the background
    if (!chat) return
    const { channel } = await chat.createDirectConversation({ user, channelData: {} })
    navigation.navigate("Chat", { channelId: channel.id })
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
          <ListItem title={user.name || user.id} onPress={() => openChat(user)} />
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

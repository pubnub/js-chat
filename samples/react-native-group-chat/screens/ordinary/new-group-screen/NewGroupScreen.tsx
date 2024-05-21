import { useState, useContext } from "react"
import { View, StyleSheet, FlatList } from "react-native"
import { StackScreenProps } from "@react-navigation/stack"
import { nanoid } from "nanoid"
import { User } from "@pubnub/chat"

import { HomeStackParamList } from "../../../types"
import { ChatContext } from "../../../context"
import { ListItem, Avatar } from "../../../components"
import { Button, Gap, Line, TextInput, colorPalette as colors } from "../../../ui-components"

export function NewGroupScreen({ navigation }: StackScreenProps<HomeStackParamList, "NewGroup">) {
  const { chat, users, setCurrentChannel, setLoading } = useContext(ChatContext)
  const [searchText, setSearchText] = useState("")
  const [groupName, setGroupName] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])

  function toggleUser(user: User) {
    setSelectedUsers((selectedUsers) => {
      return selectedUsers.find((u) => u.id === user.id)
        ? selectedUsers.filter((u) => u.id !== user.id)
        : [...selectedUsers, user]
    })
  }

  async function openChat() {
    if (!chat) return
    setLoading(true)
    navigation.popToTop()
    navigation.navigate("Chat")
    const { channel } = await chat.createGroupConversation({
      users: selectedUsers,
      channelId: `group.${nanoid()}`,
      channelData: { name: groupName },
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
      <Line />
      <Gap value={12} />

      <TextInput value={groupName} onChangeText={setGroupName} label="Group name" />

      <Gap value={16} />
      <Line />
      <Gap value={12} />

      <FlatList
        data={users.filter((user) => user.name?.toLowerCase().includes(searchText.toLowerCase()))}
        renderItem={({ item: user }) => (
          <ListItem
            avatar={<Avatar source={user} />}
            title={user.name || user.id}
            onPress={() => toggleUser(user)}
            showCheckbox
            checked={!!selectedUsers.find((u) => u.id === user.id)}
          />
        )}
        keyExtractor={(user) => user.id}
      />

      <Gap value={12} />

      <Button size="md" onPress={openChat} disabled={!groupName.length || !selectedUsers.length}>
        Create
      </Button>
      <Gap value={12} />
      <Button size="md" variant="outlined" onPress={() => navigation.pop()}>
        Cancel
      </Button>
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

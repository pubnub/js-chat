import { useState, useContext, useEffect } from "react"
import { View, StyleSheet, FlatList } from "react-native"
import { StackScreenProps } from "@react-navigation/stack"
import { nanoid } from "nanoid"

import { ChatContext } from "../../../context"
import { ListItem } from "../../../components"
import { Button, Gap, Line, TextInput, colorPalette as colors } from "../../../ui-components"

export function NewGroupScreen({ navigation }: StackScreenProps<HomeStackParamList, "NewGroup">) {
  const [searchText, setSearchText] = useState("")
  const [groupName, setGroupName] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const { chat, users, setUsers } = useContext(ChatContext)

  async function fetchUsers() {
    const { users } = await chat?.getUsers()
    setUsers(users)
  }

  function toggleUser(user: User) {
    setSelectedUsers((selectedUsers) => {
      return selectedUsers.find((u) => u.id === user.id)
        ? selectedUsers.filter((u) => u.id !== user.id)
        : [...selectedUsers, user]
    })
  }

  async function openChat() {
    // TODO: this should ideally navigate first and create channel in the background
    const { channel } = await chat?.createGroupConversation({
      users: selectedUsers,
      channelId: nanoid(),
      channelData: { name: groupName },
    })
    navigation.navigate("Chat", { channelId: channel.id })
  }

  useEffect(() => {
    if (!users.length) fetchUsers()
  }, [])

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
        data={users.filter((user) => user.name.toLowerCase().includes(searchText.toLowerCase()))}
        renderItem={({ item: user }) => (
          <ListItem
            title={user.name}
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

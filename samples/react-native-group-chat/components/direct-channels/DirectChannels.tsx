import React, { useContext } from "react"
import { View } from "react-native"
import { Channel, User } from "@pubnub/chat"
import { useNavigation } from "@react-navigation/native"

import { ChatContext } from "../../context"
import { ListItem, Avatar } from "../../components"

type DirectChannelsProps = {
  searchText?: string
  sortByActive?: boolean
  showIndicators?: boolean
}

export function DirectChannels({
  searchText = "",
  sortByActive = false,
  showIndicators = false,
}: DirectChannelsProps) {
  const { chat, users, memberships, setCurrentChannel } = useContext(ChatContext)
  const navigation = useNavigation()

  const entries = memberships.flatMap((m) => {
    if (m.channel.type !== "direct") return []
    const user = getInterlocutor(m.channel)
    if (!user) return []
    return { channel: m.channel, user }
  })

  function userName(user: User) {
    return user.name || user.id
  }

  function getInterlocutor(channel: Channel) {
    if (!chat) return
    const userId = channel.id
      .replace("direct.", "")
      .replace(chat?.currentUser.id, "")
      .replace("&", "")
    return users.find((u) => u.id === userId)
  }

  function openChat(channel: Channel) {
    setCurrentChannel(channel)
    // TODO: fix navigation type error
    navigation.navigate("Chat")
  }

  function sortEntries(a: User, b: User) {
    if (sortByActive && a.active !== b.active) return a.active ? -1 : 1
    return userName(a).localeCompare(userName(b))
  }

  return (
    chat && (
      <View>
        {entries
          .filter(({ user }) => userName(user).toLowerCase().includes(searchText.toLowerCase()))
          .sort((a, b) => sortEntries(a.user, b.user))
          .map(({ user, channel }) => (
            <ListItem
              key={channel.id}
              avatar={<Avatar source={user} showIndicator={showIndicators} />}
              title={userName(user)}
              onPress={() => openChat(channel)}
              // TODO: unread messages count badge
            />
          ))}
      </View>
    )
  )
}

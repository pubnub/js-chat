import React, { useCallback, useContext, useEffect, useState } from "react"
import { StyleSheet, ScrollView, TouchableHighlight } from "react-native"
import { useFocusEffect } from "@react-navigation/native"
import { StackScreenProps } from "@react-navigation/stack"
import { Channel, Membership } from "@pubnub/chat"

import { ChatContext } from "../../../context"
import { Gap, Line, TextInput, colorPalette as colors } from "../../../ui-components"
import { HomeStackParamList } from "../../../types"
import { ChannelsSection } from "../../../components/channels-section"
import { UnreadChannelsSection } from "../../../components/unread-channels-section"
import { MaterialIcons } from "@expo/vector-icons"

export function HomeScreen({ navigation }: StackScreenProps<HomeStackParamList, "Home">) {
  const { chat, setMemberships, setUsers } = useContext(ChatContext)
  const [searchText, setSearchText] = useState("")
  const [currentUserGroupChannels, setCurrentUserGroupChannels] = useState<Channel[]>([])
  const [currentUserDirectChannels, setCurrentUserDirectChannels] = useState<Channel[]>([])
  const [currentUserPublicChannels, setCurrentUserPublicChannels] = useState<Channel[]>([])
  const [unreadChannels, setUnreadChannels] = useState<
    { channel: Channel; count: number; membership: Membership }[]
  >([])

  const fetchUnreadMessagesCount = useCallback(async () => {
    if (!chat) {
      return
    }

    const unreadMessagesCounts = await chat.getUnreadMessagesCounts()
    setUnreadChannels(unreadMessagesCounts)
  }, [chat])

  useEffect(() => {
    async function init() {
      if (!chat) {
        return
      }

      const [, membershipsObject, usersObject] = await Promise.all([
        fetchUnreadMessagesCount(),
        chat.currentUser.getMemberships(),
        chat.getUsers({}),
      ])

      setUsers(usersObject.users)

      const channels = membershipsObject.memberships.map((m) => m.channel)
      setMemberships(membershipsObject.memberships)

      setCurrentUserGroupChannels(channels.filter((c) => c.type === "group"))
      setCurrentUserDirectChannels(channels.filter((c) => c.type === "direct"))
      setCurrentUserPublicChannels(channels.filter((c) => c.type === "public"))
    }

    init()
  }, [chat])

  useFocusEffect(
    React.useCallback(() => {
      fetchUnreadMessagesCount()
    }, [])
  )

  const getFilteredChannels = useCallback(
    (channels: Channel[]) => {
      return channels.filter(
        (c) => c.name && c.name.toLowerCase().includes(searchText.toLowerCase())
      )
    },
    [searchText]
  )

  const getFilteredUnreadChannels = useCallback(
    (unreadChannelCounts: { channel: Channel; count: number; membership: Membership }[]) => {
      return unreadChannelCounts.filter(
        (c) => c.channel.name && c.channel.name.toLowerCase().includes(searchText.toLowerCase())
      )
    },
    [searchText]
  )

  const markAllMessagesAsRead = useCallback(async () => {
    if (!chat) {
      return
    }

    await chat.markAllMessagesAsRead()
    await fetchUnreadMessagesCount()
  }, [chat])

  return (
    <>
      <ScrollView style={styles.container}>
        <TextInput
          onChangeText={setSearchText}
          value={searchText}
          placeholder="Search"
          icon="search"
          variant="search"
        />
        <Gap value={16} />
        <Line />
        <Gap value={8} />
        <UnreadChannelsSection
          onPress={(channelId) => navigation.navigate("Chat", { channelId })}
          unreadChannels={getFilteredUnreadChannels(unreadChannels)}
          markAllMessagesAsRead={markAllMessagesAsRead}
        />
        <Gap value={8} />
        <Line />
        <Gap value={8} />
        <ChannelsSection
          channels={getFilteredChannels(currentUserPublicChannels)}
          title="PUBLIC CHANNELS"
          onAddIconPress={() => null}
          onChannelPress={(channelId) => navigation.navigate("Chat", { channelId })}
        />
        <Gap value={8} />
        <Line />
        <Gap value={8} />
        <ChannelsSection
          channels={getFilteredChannels(currentUserGroupChannels)}
          title="GROUPS"
          onAddIconPress={() => null}
          onChannelPress={(channelId) => navigation.navigate("Chat", { channelId })}
        />
        <Gap value={8} />
        <Line />
        <Gap value={8} />
        <ChannelsSection
          channels={getFilteredChannels(currentUserDirectChannels)}
          title="DIRECT MESSAGES"
          onAddIconPress={() => null}
          onChannelPress={(channelId) => navigation.navigate("Chat", { channelId })}
        />
      </ScrollView>
      <TouchableHighlight
        underlayColor={colors.navy800}
        style={styles.fab}
        onPress={() => navigation.navigate("NewChat")}
      >
        <MaterialIcons name="chat-bubble" size={32} color={colors.neutral0} />
      </TouchableHighlight>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.neutral0,
    flex: 1,
    padding: 16,
  },
  screenContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },
  fab: {
    backgroundColor: colors.navy900,
    borderRadius: 100,
    bottom: 20,
    padding: 16,
    position: "absolute",
    right: 20,
  },
})

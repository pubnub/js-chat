import React, { useCallback, useContext, useEffect, useState } from "react"
import { StyleSheet, ScrollView } from "react-native"
import { ChatContext } from "../../../context"
import { Gap, Line, usePNTheme } from "../../../ui-components"
import { Channel, Membership } from "@pubnub/chat"
import { SearchBar } from "../../../components/search-bar"
import { HomeStackParamList } from "../../../types"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useFocusEffect } from "@react-navigation/native"
import { ChannelsSection } from "../../../components/channels-section"
import { UnreadChannelsSection } from "../../../components/unread-channels-section"

export function HomeScreen({ navigation }: NativeStackScreenProps<HomeStackParamList, "Home">) {
  const { chat, setMemberships } = useContext(ChatContext)
  const [searchText, setSearchText] = useState("")
  const [currentUserGroupChannels, setCurrentUserGroupChannels] = useState<Channel[]>([])
  const [currentUserDirectChannels, setCurrentUserDirectChannels] = useState<Channel[]>([])
  const [currentUserPublicChannels, setCurrentUserPublicChannels] = useState<Channel[]>([])

  const theme = usePNTheme()

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

      const [, membershipsObject] = await Promise.all([
        fetchUnreadMessagesCount(),
        chat.currentUser.getMemberships(),
      ])

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
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.neutral0 }]}>
      <Gap value={24} />
      <SearchBar onChangeText={setSearchText} value={searchText} />
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
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    flex: 1,
  },
  screenContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },
})

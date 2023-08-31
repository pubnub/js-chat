import React, { useCallback, useContext, useEffect, useState } from "react"
import { StyleSheet, ScrollView } from "react-native"
import { ChatContext } from "../../../context"
import { Gap } from "../../../components/gap"
import { Channel, Membership } from "@pubnub/chat"
import { Line } from "../../../components/line"
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
    <ScrollView style={styles.container}>
      <Gap paddingTop={24} />
      <SearchBar onChangeText={setSearchText} value={searchText} />
      <Gap paddingBottom={16} />
      <Line />
      <Gap paddingBottom={8} />
      <UnreadChannelsSection
        onPress={(channelId) => navigation.navigate("Chat", { channelId })}
        unreadChannels={getFilteredUnreadChannels(unreadChannels)}
        markAllMessagesAsRead={markAllMessagesAsRead}
      />
      <Gap paddingBottom={8} />
      <Line />
      <Gap paddingBottom={8} />
      <ChannelsSection
        channels={getFilteredChannels(currentUserPublicChannels)}
        title="PUBLIC CHANNELS"
        onAddIconPress={() => null}
        onChannelPress={(channelId) => navigation.navigate("Chat", { channelId })}
      />
      <Gap paddingBottom={8} />
      <Line />
      <Gap paddingBottom={8} />
      <ChannelsSection
        channels={getFilteredChannels(currentUserGroupChannels)}
        title="GROUPS"
        onAddIconPress={() => null}
        onChannelPress={(channelId) => navigation.navigate("Chat", { channelId })}
      />
      <Gap paddingBottom={8} />
      <Line />
      <Gap paddingBottom={8} />
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
    backgroundColor: "#ffffff",
    flex: 1,
  },
  screenContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },
  appButtonContainer: {
    elevation: 8,
    backgroundColor: "#009688",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  appButtonText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
    alignSelf: "center",
    textTransform: "uppercase",
  },
  sectionContainer: {
    minHeight: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 16,
  },
  sectionText: {
    fontSize: 14,
  },
  sectionIcons: {
    flexDirection: "row",
  },
})

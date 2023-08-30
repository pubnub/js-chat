import React, { useCallback, useContext, useEffect, useState } from "react"
import {View, Text, StyleSheet, Image, ScrollView, TouchableOpacity} from "react-native"
import { ChannelSectionItem } from "../../../components/channel-section-item"
import { ChatContext } from "../../../context"
import { Gap } from "../../../components/gap"
import { Channel, Membership } from "@pubnub/chat"
import { Line } from "../../../components/line"
import { SearchBar } from "../../../components/search-bar"
import { HomeStackParamList } from "../../../types"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { UnreadChannelSectionItem } from "../../../components/unread-channel-section-item"

export function HomeScreen({
  navigation,
  route,
}: NativeStackScreenProps<HomeStackParamList, "Home">) {
  const { chat } = useContext(ChatContext)
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

      setCurrentUserGroupChannels(channels.filter((c) => c.type === "group"))
      setCurrentUserDirectChannels(channels.filter((c) => c.type === "direct"))
      setCurrentUserPublicChannels(channels.filter((c) => c.type === "public"))
    }

    init()
  }, [chat])

  const getFilteredChannels = useCallback(
    (channels: Channel[]) => {
      return channels.filter(
        (c) => c.name && c.name.toLowerCase().includes(searchText.toLowerCase())
      )
    },
    [searchText]
  )

  const getFilteredUnreadChannels = useCallback(
    (unreadChannelCounts: { channel: Channel; count: number }[]) => {
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
      <Text>You are logged in as {route.params.name}</Text>
      <Gap paddingTop={24} />
      <SearchBar onChangeText={setSearchText} value={searchText} />
      <Gap paddingBottom={16} />
      <Line />
      <Gap paddingBottom={16} />
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionText}>UNREAD</Text>
        <TouchableOpacity onPress={markAllMessagesAsRead}>
          <Image source={require("../../../assets/more_horiz.png")} />
        </TouchableOpacity>
      </View>
      {getFilteredUnreadChannels(unreadChannels).map((channelObject) => (
        <UnreadChannelSectionItem
          key={channelObject.channel.id}
          avatarUrl={`https://loremflickr.com/40/40?random=${channelObject.channel.id}`}
          channelName={channelObject.channel.name || channelObject.channel.id}
          onPress={() => navigation.navigate("Chat", { channelId: channelObject.channel.id })}
          unreadMessagesCount={channelObject.count}
        />
      ))}
      <Gap paddingBottom={16} />
      <Line />
      <Gap paddingBottom={16} />
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionText}>PUBLIC CHANNELS</Text>
        <Image source={require("../../../assets/add.png")} />
      </View>
      {getFilteredChannels(currentUserPublicChannels).map((c) => (
        <ChannelSectionItem
          key={c.id}
          avatarUrl={`https://loremflickr.com/40/40?random=${c.id}`}
          channelName={c.name || c.id}
          onPress={() => navigation.navigate("Chat", { channelId: c.id })}
        />
      ))}
      <Gap paddingBottom={16} />
      <Line />
      <Gap paddingBottom={16} />
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionText}>GROUPS</Text>
        <Image source={require("../../../assets/add.png")} />
      </View>
      {getFilteredChannels(currentUserGroupChannels).map((c) => (
        <ChannelSectionItem
          key={c.id}
          avatarUrl={`https://loremflickr.com/40/40?random=${c.id}`}
          channelName={c.name || c.id}
          onPress={() => navigation.navigate("Chat", { channelId: c.id })}
        />
      ))}
      <Gap paddingBottom={16} />
      <Line />
      <Gap paddingBottom={16} />
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionText}>DIRECT MESSAGES</Text>
      </View>
      <Gap paddingBottom={16} />
      {getFilteredChannels(currentUserDirectChannels).map((c) => (
        <ChannelSectionItem
          key={c.id}
          avatarUrl={`https://loremflickr.com/40/40?random=${c.id}`}
          channelName={c.name || c.id}
          onPress={() => navigation.navigate("Chat", { channelId: c.id })}
        />
      ))}
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
})

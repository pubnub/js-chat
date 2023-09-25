import React, { useCallback, useContext, useEffect, useState } from "react"
import { StyleSheet, ScrollView, TouchableHighlight, TouchableOpacity } from "react-native"
import { useFocusEffect } from "@react-navigation/native"
import { StackScreenProps } from "@react-navigation/stack"
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons"
import { Channel, Membership } from "@pubnub/chat"

import { Gap, Line, TextInput, colorPalette as colors, Accordion } from "../../../ui-components"
import { ListItem, Avatar } from "../../../components"
import { HomeStackParamList } from "../../../types"
import { ChatContext } from "../../../context"

export function HomeScreen({ navigation }: StackScreenProps<HomeStackParamList, "Home">) {
  const { chat, memberships, setCurrentChannel, setMemberships, setUsers, getInterlocutor } =
    useContext(ChatContext)
  const [searchText, setSearchText] = useState("")
  const [unreadChannels, setUnreadChannels] = useState<
    { channel: Channel; count: number; membership: Membership }[]
  >([])

  const channels = memberships.map((m) => m.channel)
  const currentUserDirectChannels = channels.filter((c) => c.type === "direct")
  const currentUserGroupChannels = channels.filter((c) => c.type === "group")
  const currentUserPublicChannels = channels.filter((c) => c.type === "public")

  function navigateToChat(channel: Channel) {
    setCurrentChannel(channel)
    navigation.navigate("Chat")
  }

  const fetchUnreadMessagesCount = useCallback(async () => {
    if (!chat) return
    const unreadMessagesCounts = await chat.getUnreadMessagesCounts()
    setUnreadChannels(unreadMessagesCounts)
  }, [chat])

  useEffect(() => {
    async function init() {
      if (!chat) return
      const [, { memberships }, { users }] = await Promise.all([
        fetchUnreadMessagesCount(),
        chat.currentUser.getMemberships(),
        chat.getUsers({}),
      ])

      setUsers(users)
      setMemberships(memberships)
    }

    init()
  }, [chat, fetchUnreadMessagesCount, setMemberships, setUsers])

  useFocusEffect(
    React.useCallback(() => {
      fetchUnreadMessagesCount()
      setCurrentChannel(null)
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
    if (!chat) return
    await chat.markAllMessagesAsRead()
    await fetchUnreadMessagesCount()
  }, [chat, fetchUnreadMessagesCount])

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
        <Gap value={20} />

        <Accordion
          title="UNREAD"
          icons={
            <TouchableOpacity onPress={markAllMessagesAsRead} style={{ marginRight: 16 }}>
              <MaterialCommunityIcons name="dots-horizontal" size={24} color={colors.neutral400} />
            </TouchableOpacity>
          }
        >
          {getFilteredUnreadChannels(unreadChannels).map(({ channel, count }) => {
            const interlocutor = channel.type === "direct" && getInterlocutor(channel)
            const source = interlocutor || channel

            return (
              <ListItem
                key={channel.id}
                title={source.name || source.id}
                avatar={<Avatar source={source} />}
                onPress={() => navigateToChat(channel)}
                badge={String(count)}
              />
            )
          })}
        </Accordion>

        <Gap value={8} />
        <Line />
        <Gap value={20} />

        <Accordion title="PUBLIC CHANNELS">
          {getFilteredChannels(currentUserPublicChannels).map((channel) => (
            <ListItem
              key={channel.id}
              title={channel.name || channel.id}
              avatar={<Avatar source={channel} />}
              onPress={() => navigateToChat(channel)}
            />
          ))}
        </Accordion>

        <Gap value={8} />
        <Line />
        <Gap value={20} />

        <Accordion title="GROUPS">
          {getFilteredChannels(currentUserGroupChannels).map((channel) => (
            <ListItem
              key={channel.id}
              title={channel.name || channel.id}
              avatar={<Avatar source={channel} />}
              onPress={() => navigateToChat(channel)}
            />
          ))}
        </Accordion>

        <Gap value={8} />
        <Line />
        <Gap value={20} />

        <Accordion title="DIRECT MESSAGES">
          {getFilteredChannels(currentUserDirectChannels).map((channel) => {
            const source = getInterlocutor(channel) || channel

            return (
              <ListItem
                key={source.id}
                title={source.name || source.id}
                avatar={<Avatar source={source} showIndicator />}
                onPress={() => navigateToChat(channel)}
              />
            )
          })}
        </Accordion>

        <Gap value={32} />
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
  fab: {
    backgroundColor: colors.navy900,
    borderRadius: 100,
    bottom: 20,
    padding: 16,
    position: "absolute",
    right: 20,
  },
})

import React, { useContext, useState } from "react"
import { View, StyleSheet, FlatList, TouchableOpacity } from "react-native"
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs"
import { MaterialIcons } from "@expo/vector-icons"
import { Channel } from "@pubnub/chat"

import { BottomTabsParamList } from "../../../types"
import { ChatContext } from "../../../context"
import { ListItem } from "../../../components"
import { Gap, Line, TextInput, Button, Text, colorPalette as colors } from "../../../ui-components"

type ListEntry = {
  title: string
  active: boolean
  channelId: string
}

export function PeopleScreen({ navigation }: BottomTabScreenProps<BottomTabsParamList, "People">) {
  const [searchText, setSearchText] = useState("")
  const [tooltipShown, setTooltipShown] = useState(false)
  const [sortByActive, setSortByActive] = useState(true)
  const { chat, memberships, users } = useContext(ChatContext)
  const directChannels = memberships.map((m) => m.channel).filter((c) => c.type === "direct")
  const entries: ListEntry[] = directChannels.flatMap((c) => {
    const userId = getInterlocutorId(c)
    if (!userId) return []
    const user = users.find((u) => u.id === userId)
    return user
      ? { title: user.name || user.id, active: !!user.active, channelId: c.id }
      : { title: userId, active: false, channelId: c.id }
  })

  function getInterlocutorId(channel: Channel) {
    if (!chat) return
    return channel.id.replace("direct.", "").replace(chat.currentUser.id, "").replace("&", "")
  }

  function sortEntries(a: ListEntry, b: ListEntry) {
    if (sortByActive && a.active !== b.active) return a.active ? -1 : 1
    return a.title.localeCompare(b.title)
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
      <Gap value={20} />

      <View style={[styles.row, { zIndex: 1 }]}>
        <Text variant="label">DIRECT MESSAGES</Text>

        <TouchableOpacity onPress={() => setTooltipShown(!tooltipShown)}>
          <MaterialIcons name="sort" size={20} color={colors.neutral400} />
        </TouchableOpacity>

        {tooltipShown ? (
          <View style={styles.tooltip}>
            <View style={{ paddingHorizontal: 16, paddingBottom: 6 }}>
              <Text variant="smallLabel" color="neutral500">
                Sort by
              </Text>
            </View>
            <Button
              variant="list"
              size="sm"
              align="left"
              onPress={() => {
                setSortByActive(true)
                setTooltipShown(false)
              }}
              iconRight={sortByActive ? "check" : undefined}
            >
              Active
            </Button>
            <Button
              variant="list"
              size="sm"
              align="left"
              onPress={() => {
                setSortByActive(false)
                setTooltipShown(false)
              }}
              iconRight={sortByActive ? undefined : "check"}
            >
              Name
            </Button>
          </View>
        ) : null}
      </View>
      <Gap value={20} />

      <FlatList
        data={entries
          .filter(
            (entry) => entry.title && entry.title.toLowerCase().includes(searchText.toLowerCase())
          )
          .sort(sortEntries)}
        renderItem={({ item: entry }) => (
          <ListItem
            title={entry.title}
            showActive
            active={entry.active}
            // TODO: fix navigation type error
            onPress={() => navigation.navigate("Chat", { channelId: entry.channelId })}
            // TODO: unread messages count badge
          />
        )}
        keyExtractor={(entry) => entry.channelId}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.neutral0,
    flex: 1,
    padding: 16,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  tooltip: {
    backgroundColor: colors.neutral0,
    borderColor: colors.neutral300,
    borderRadius: 6,
    borderWidth: 1,
    elevation: 10,
    paddingVertical: 6,
    position: "absolute",
    right: 0,
    shadowColor: colors.neutral600,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    top: 30,
    width: "50%",
  },
})

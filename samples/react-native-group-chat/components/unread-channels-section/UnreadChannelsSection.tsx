import React, { useState } from "react"
import { Channel, Membership } from "@pubnub/chat"
import { TouchableOpacity, View, StyleSheet } from "react-native"
import { List, useTheme } from "react-native-paper"

import { ListItem } from "../list-item"
import { Icon, defaultTheme } from "../../ui-components"

type UnreadChannelsSection = {
  onPress: (channelId: string) => void
  unreadChannels: { channel: Channel; count: number; membership: Membership }[]
  markAllMessagesAsRead: () => void
}

export function UnreadChannelsSection({
  onPress,
  unreadChannels,
  markAllMessagesAsRead,
}: UnreadChannelsSection) {
  const [isSectionExpanded, setIsSectionExpanded] = useState(true)
  const theme = useTheme() as typeof defaultTheme

  return (
    <List.Accordion
      title="UNREAD"
      expanded={isSectionExpanded}
      titleStyle={[styles.accordionTitleStyle, theme.textStyles.label]}
      style={[styles.container, { backgroundColor: theme.colors.neutral0 }]}
      pointerEvents="auto"
      right={() => (
        <View style={styles.sectionIcons}>
          <TouchableOpacity onPress={markAllMessagesAsRead}>
            <Icon icon="dots-horizontal" iconColor="neutral400" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsSectionExpanded(!isSectionExpanded)}>
            {isSectionExpanded ? (
              <Icon icon="chevron-up" iconColor="neutral400" />
            ) : (
              <Icon icon="chevron-down" iconColor="neutral400" />
            )}
          </TouchableOpacity>
        </View>
      )}
    >
      {unreadChannels.map((unreadChannel) => (
        <ListItem
          key={unreadChannel.channel.id}
          title={unreadChannel.channel.name || unreadChannel.channel.id}
          onPress={() => onPress(unreadChannel.channel.id)}
          badge={String(unreadChannel.count)}
        />
      ))}
    </List.Accordion>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 0,
  },
  sectionIcons: {
    flexDirection: "row",
    right: -16,
  },
  accordionTitleStyle: {
    left: -16,
  },
})

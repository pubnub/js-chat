import React, { useState } from "react"
import { Channel, Membership } from "@pubnub/chat"
import { TouchableOpacity, View, StyleSheet } from "react-native"
import { Badge, List, useTheme } from "react-native-paper"
import { Icon } from "../../ui-components/icon"
import { RandomAvatar } from "../../ui-components/random-avatar"
import { defaultTheme } from "../../ui-components/defaultTheme"

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
        <List.Item
          key={unreadChannel.channel.id}
          title={unreadChannel.channel.name || unreadChannel.channel.id}
          onPress={() => onPress(unreadChannel.channel.id)}
          titleStyle={theme.textStyles.smallBody}
          left={() => (
            <View style={styles.avatarContainer}>
              <RandomAvatar />
            </View>
          )}
          right={() => <Badge>{unreadChannel.count}</Badge>}
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
  avatarContainer: {
    marginLeft: 16,
  },
})

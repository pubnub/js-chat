import React, { useState } from "react"
import { Channel, Membership } from "@pubnub/chat"
import { TouchableOpacity, View, StyleSheet } from "react-native"
import { Avatar, Badge, List } from "react-native-paper"
import MoreIcon from "../../assets/more_horiz.svg"
import ExpandMore from "../../assets/expand_more.svg"
import ExpandLess from "../../assets/expand_less.svg"

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

  return (
    <List.Accordion
      title="UNREAD"
      expanded={isSectionExpanded}
      titleStyle={styles.accordionTitleStyle}
      style={styles.container}
      pointerEvents="auto"
      right={() => (
        <View style={styles.sectionIcons}>
          <TouchableOpacity onPress={markAllMessagesAsRead} style={styles.moreIconContainer}>
            <MoreIcon fill="#A3A3A3" width={24} height={24} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsSectionExpanded(!isSectionExpanded)} hitSlop={48}>
            {isSectionExpanded ? (
              <ExpandLess fill="#A3A3A3" width={24} height={24} />
            ) : (
              <ExpandMore fill="#A3A3A3" width={24} height={24} />
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
          titleStyle={styles.itemTitleStyle}
          left={() => (
            <Avatar.Image
              size={27}
              style={styles.avatar}
              source={{ uri: `https://loremflickr.com/40/40?random=${unreadChannel.channel.id}` }}
            />
          )}
          right={() => <Badge>{unreadChannel.count}</Badge>}
        />
      ))}
    </List.Accordion>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    paddingVertical: 0,
  },
  sectionIcons: {
    flexDirection: "row",
    right: -16,
  },
  accordionTitleStyle: {
    fontSize: 14,
    lineHeight: 20,
    color: "#171717",
    left: -16,
  },
  itemTitleStyle: {
    fontSize: 14,
    lineHeight: 20,
    color: "#171717",
  },
  avatar: {
    marginLeft: 16,
  },
  moreIconContainer: {
    paddingRight: 8,
  },
})

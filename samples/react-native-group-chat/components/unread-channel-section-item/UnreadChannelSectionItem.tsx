import React from "react";
import { ChannelSectionItem } from "../channel-section-item"
import { Badge } from "react-native-paper"

type UnreadChannelSectionItemProps = {
  avatarUrl: string
  channelName: string
  unreadMessagesCount: number
  onPress: () => void
}

export function UnreadChannelSectionItem({
  avatarUrl,
  channelName,
  unreadMessagesCount,
  onPress,
}: UnreadChannelSectionItemProps) {
  return (
    <ChannelSectionItem
      avatarUrl={avatarUrl}
      channelName={channelName}
      rightComponent={<Badge>{unreadMessagesCount}</Badge>}
      onPress={onPress}
    />
  )
}

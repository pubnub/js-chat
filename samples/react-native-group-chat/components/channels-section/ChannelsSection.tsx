import React, { useState } from "react"
import { TouchableOpacity, View, StyleSheet } from "react-native"
import { Channel } from "@pubnub/chat"
import { List } from "react-native-paper"

import { Icon, usePNTheme } from "../../ui-components"
import { ListItem } from "../list-item"

type ChannelsSectionProps = {
  channels: Channel[]
  title: string
  onAddIconPress: () => void
  onChannelPress: (channelId: string) => void
}

export function ChannelsSection({
  title,
  channels,
  onAddIconPress,
  onChannelPress,
}: ChannelsSectionProps) {
  const [isSectionExpanded, setIsSectionExpanded] = useState(true)
  const theme = usePNTheme()

  return (
    <List.Accordion
      title={title}
      expanded={isSectionExpanded}
      titleStyle={[styles.accordionTitleStyle, theme.textStyles.label]}
      style={[styles.container, { backgroundColor: theme.colors.neutral0 }]}
      pointerEvents="auto"
      right={() => (
        <View style={styles.sectionIcons}>
          {/* <TouchableOpacity onPress={onAddIconPress}>
            <Icon icon="plus" iconColor="neutral400" />
          </TouchableOpacity> */}
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
      {channels.map((channel) => (
        <ListItem
          key={channel.id}
          title={channel.name || channel.id}
          onPress={() => onChannelPress(channel.id)}
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

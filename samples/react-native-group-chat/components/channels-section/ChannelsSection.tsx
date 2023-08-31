import React, { useState } from "react";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import ExpandMore from "../../assets/expand_more.svg";
import ExpandLess from "../../assets/expand_less.svg";
import { Channel } from "@pubnub/chat";
import { Avatar, List } from "react-native-paper"
import AddIcon from "../../assets/add.svg";

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

  return (
    <List.Accordion
      title={title}
      expanded={isSectionExpanded}
      titleStyle={styles.accordionTitleStyle}
      style={styles.container}
      pointerEvents="auto"
      right={() => (
        <View style={styles.sectionIcons}>
          <TouchableOpacity onPress={onAddIconPress} style={styles.plusIconContainer}>
            <AddIcon width={24} height={24} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsSectionExpanded(!isSectionExpanded)}>
            {isSectionExpanded ? (
              <ExpandLess fill="#A3A3A3" width={24} height={24} />
            ) : (
              <ExpandMore fill="#A3A3A3" width={24} height={24} />
            )}
          </TouchableOpacity>
        </View>
      )}
    >
      {channels.map((channel) => (
        <List.Item
          key={channel.id}
          title={channel.name || channel.id}
          onPress={() => onChannelPress(channel.id)}
          titleStyle={styles.itemTitleStyle}
          left={() => (
            <Avatar.Image
              size={27}
              style={styles.avatar}
              source={{ uri: `https://loremflickr.com/40/40?random=${channel.id}` }}
            />
          )}
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
  plusIconContainer: {
    paddingRight: 8,
  },
})

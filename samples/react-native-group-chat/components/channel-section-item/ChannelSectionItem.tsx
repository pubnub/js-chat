import React from "react";
import {StyleSheet, View, Text, TouchableOpacity, Alert} from "react-native";
import { Avatar } from "react-native-paper"

type ChannelSectionItemProps = {
  avatarUrl: string
  channelName: string
  rightComponent?: React.ReactElement | null
  onPress: () => void
}

export function ChannelSectionItem({
  avatarUrl,
  channelName,
  rightComponent = null,
  onPress,
}: ChannelSectionItemProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Avatar.Image size={27} source={{ uri: avatarUrl }} />
      <Text style={styles.text}>{channelName}</Text>
      <View style={styles.rightComponentWrapper}>
        {rightComponent}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    minHeight: 48,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 16,
    paddingRight: 16,
    flexDirection: "row",
    alignItems: "center",
    color: "#171717",
    fontWeight: 400,
  },
  text: {
    paddingLeft: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  rightComponentWrapper: {
    flex: 1,
  },
})

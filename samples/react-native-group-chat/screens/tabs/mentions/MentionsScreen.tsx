import React, { useContext, useState } from "react"
import { View, StyleSheet, ScrollView, TouchableHighlight, ActivityIndicator } from "react-native"
import { useFocusEffect } from "@react-navigation/native"
import { UserMentionData, TimetokenUtils } from "@pubnub/chat"
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs"

import { colorPalette as colors, Line, Text } from "../../../ui-components"
import { ChatContext } from "../../../context"
import { Avatar } from "../../../components"
import { BottomTabsParamList } from "../../../types"

export function MentionsScreen({
  navigation,
}: BottomTabScreenProps<BottomTabsParamList, "Mentions">) {
  const { chat, setCurrentChannel } = useContext(ChatContext)
  const [mentions, setMentions] = useState<UserMentionData[]>([])
  const [loading, setLoading] = useState(true)

  async function openChannel(channelId: string) {
    if (!chat) return
    const channel = await chat.getChannel(channelId)
    if (!channel) {
      alert("This channel no longer exists.")
      return
    }
    setCurrentChannel(channel)
    navigation.navigate("Chat")
  }

  useFocusEffect(() => {
    const init = async () => {
      if (!chat) return
      const { enhancedMentionsData } = await chat.getCurrentUserMentions()
      setMentions(enhancedMentionsData.reverse())
      setLoading(false)
    }
    if (chat) init()
  })

  if (loading || !mentions.length) {
    return (
      <View style={styles.loading}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.navy700} />
        ) : (
          <Text textAlign="center">No mentions found.</Text>
        )}
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      {mentions.map((mention, index) => (
        <View key={mention.event.timetoken}>
          <TouchableHighlight
            onPress={() => openChannel(mention.message.channelId)}
            underlayColor={colors.neutral50}
          >
            <View>
              <Text variant="smallBody" color="neutral600">
                {TimetokenUtils.timetokenToDate(mention.message.timetoken).toLocaleString([], {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "numeric",
                })}
              </Text>
              <View style={styles.message}>
                <Avatar source={mention.user} style={{ marginTop: 10 }} />
                <View style={styles.bubble}>
                  <Text>{mention.message.text}</Text>
                </View>
              </View>
            </View>
          </TouchableHighlight>
          {index !== mentions.length - 1 && <Line style={{ marginVertical: 16 }} />}
        </View>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  loading: {
    backgroundColor: colors.neutral0,
    flex: 1,
    justifyContent: "center",
  },
  container: {
    backgroundColor: colors.neutral0,
    flex: 1,
    padding: 16,
  },
  message: {
    flexDirection: "row",
    marginTop: 10,
    marginLeft: 10,
  },
  bubble: {
    backgroundColor: colors.neutral50,
    borderRadius: 6,
    borderTopLeftRadius: 0,
    marginLeft: 10,
    padding: 10,
  },
})

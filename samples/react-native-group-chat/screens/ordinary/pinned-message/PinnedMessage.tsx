import React, { useCallback, useContext, useEffect, useState } from "react"
import { View, StyleSheet } from "react-native"
import { Message } from "@pubnub/chat"
import { ChatContext } from "../../../context"
import { Bubble } from "react-native-gifted-chat"
import { EnhancedIMessage } from "../../../utils"
import { Avatar } from "../../../components"
import { MessageText } from "../../../components/message-text"
import { StackScreenProps } from "@react-navigation/stack"
import { HomeStackParamList } from "../../../types"

export function PinnedMessage({}: StackScreenProps<HomeStackParamList, "PinnedMessage">) {
  const [message, setMessage] = useState<Message | null>(null)
  const { chat, getUser, currentChannel } = useContext(ChatContext)

  useEffect(() => {
    async function init() {
      if (!chat || !currentChannel) return
      setMessage(await currentChannel.getPinnedMessage())
    }

    init()
  }, [chat, currentChannel])

  const renderMessageBubble = useCallback(
    (props: Bubble<EnhancedIMessage>["props"]) => {
      if (!message) {
        return null
      }

      const sender = getUser(props.currentMessage?.originalPnMessage.userId)

      return (
        <View style={{ flexDirection: "row" }}>
          {sender && <Avatar source={sender} size="md" />}
          <View style={{ marginRight: 8 }} />
          <Bubble
            {...props}
            user={{
              _id: props.currentMessage?.originalPnMessage.userId as string,
            }}
            renderMessageText={() => (
              <MessageText onGoToMessage={() => null} messageProps={props} />
            )}
          />
        </View>
      )
    },
    [message]
  )

  if (!message) {
    return null
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {renderMessageBubble({ currentMessage: { originalPnMessage: message, text: "example" } })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingLeft: 16,
    paddingVertical: 16,
  },
})

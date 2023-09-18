import React, {useCallback, useContext, useEffect, useState} from "react"
import { View, StyleSheet } from "react-native";
import { Text } from "../../../ui-components";
import { Message } from "@pubnub/chat"
import {ChatContext} from "../../../context";
import {Bubble} from "react-native-gifted-chat";
import {EnhancedIMessage} from "../../../utils";
import {Quote} from "../../../components";
import {useCommonChatRenderers} from "../../../hooks";
import {MessageText} from "../../../components/message-text";
import {StackScreenProps} from "@react-navigation/stack";
import {HomeStackParamList} from "../../../types";

type PinnedMessageProps = {
  channelId: string
  messageTimetoken: string
}

export function PinnedMessage({ route }: StackScreenProps<HomeStackParamList, "PinnedMessage">) {
  const [message, setMessage] = useState<Message | null>(null)
  const { chat } = useContext(ChatContext)
  const { channelId } = route.params

  useEffect(() => {
    async function init() {
      if (!chat) {
        return
      }

      const channel = await chat.getChannel(channelId)
      setMessage(await channel.getPinnedMessage())
    }

    init()
  }, [chat])

  const renderMessageBubble = useCallback((props: Bubble<EnhancedIMessage>["props"]) => {
    return (
      <Bubble
        {...props}
        user={{
          _id: props.currentMessage?.originalPnMessage.userId as string,
        }}
        renderMessageText={() => <MessageText onGoToMessage={() => null} messageProps={props} />}
        // renderTime={() => null}
        // containerToNextStyle={{ right: { marginRight: 0 } }}
        // containerStyle={{ right: { marginRight: 0 } }}
        // wrapperStyle={{
        //   right: [styles.ownBubbleBackground, { backgroundColor: theme.colors.teal100 }],
        //   left: [styles.otherBubbleBackground],
        // }}
        // textStyle={{ right: [styles.ownBubbleText, theme.textStyles.body] }}
      />
    )
  }, [])

  if (!message) {
    return null
  }

  return (
    <View style={styles.container}>
      <Text>
        Pinned message:
      </Text>
      <View style={styles.content}>
        {renderMessageBubble({ currentMessage: { originalPnMessage: message } })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    backgroundColor: "violet",
    width: 100,
    height: 100,
  },
})

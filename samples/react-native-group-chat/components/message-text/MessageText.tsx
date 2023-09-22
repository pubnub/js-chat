import React, { useCallback, useContext } from "react"
import { Bubble } from "react-native-gifted-chat"
import { EnhancedIMessage } from "../../utils"
import { Linking, View } from "react-native"
import { Quote } from "../quote"
import { Text } from "../../ui-components"
import { Message, MixedTextTypedElement } from "@pubnub/chat"
import { ChatContext } from "../../context"
import { useNavigation } from "@react-navigation/native"

type MessageTextProps = {
  onGoToMessage: (message: Message) => void
  messageProps: Bubble<EnhancedIMessage>["props"]
}

export function MessageText({ onGoToMessage, messageProps }: MessageTextProps) {
  const { chat, setCurrentChannel } = useContext(ChatContext)
  const navigation = useNavigation()

  const openLink = (link: string) => {
    Linking.openURL(link)
  }

  async function openChannel(channelId: string) {
    if (!chat) return
    const channel = await chat.getChannel(channelId)
    if (!channel) {
      alert("This channel no longer exists.")
      return
    }
    // setCurrentChannel(null)
    navigation.pop()
    setCurrentChannel(channel)
    navigation.navigate("Chat")
  }

  const renderMessagePart = useCallback(
    (messagePart: MixedTextTypedElement, index: number, userId: string | number) => {
      // TODO make it look nice
      if (messagePart.type === "text") {
        return (
          <Text variant="body" color={chat?.currentUser.id ? undefined : "neutral900"} key={index}>
            {messagePart.content.text}
          </Text>
        )
      }
      if (messagePart.type === "plainLink") {
        return (
          <Text
            key={index}
            variant="body"
            onPress={() => openLink(messagePart.content.link)}
            color="sky150"
          >
            {messagePart.content.link}
          </Text>
        )
      }
      if (messagePart.type === "textLink") {
        return (
          <Text
            key={index}
            variant="body"
            onPress={() => openLink(messagePart.content.link)}
            color="sky150"
          >
            {messagePart.content.text}
          </Text>
        )
      }
      if (messagePart.type === "mention") {
        return (
          <Text
            key={index}
            variant="body"
            onPress={() => openLink(`https://pubnub.com/${messagePart.content.id}`)}
            color="sky150"
          >
            @{messagePart.content.name}
          </Text>
        )
      }
      if (messagePart.type === "channelReference") {
        return (
          <Text
            key={index}
            variant="body"
            onPress={() => openChannel(messagePart.content.id)}
            color="sky150"
          >
            #{messagePart.content.name}
          </Text>
        )
      }

      return null
    },
    [chat?.currentUser]
  )

  if (messageProps.currentMessage?.originalPnMessage.getLinkedText()) {
    return (
      <View>
        {messageProps.currentMessage?.originalPnMessage.quotedMessage ? (
          <Quote
            message={messageProps.currentMessage?.originalPnMessage.quotedMessage}
            // onGoToMessage={() => {
            //   scrollToMessage(props.currentMessage?.originalPnMessage.quotedMessage)
            // }}
            onGoToMessage={() =>
              onGoToMessage(messageProps.currentMessage?.originalPnMessage.quotedMessage)
            }
            charactersLimit={50}
          />
        ) : null}
        <Text variant="body">
          {messageProps.currentMessage.originalPnMessage
            .getLinkedText()
            .map((msgPart, index) =>
              renderMessagePart(
                msgPart,
                index,
                messageProps.currentMessage?.originalPnMessage.userId || ""
              )
            )}
        </Text>
      </View>
    )
  }

  return <Text variant="body">{messageProps.currentMessage?.text}</Text>
}

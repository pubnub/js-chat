import {Linking, View} from "react-native";
import React, {useCallback} from "react";
import {Chat, MixedTextTypedElement, User} from "@pubnub/chat";
import {Text} from "../ui-components";
import {Bubble} from "react-native-gifted-chat";
import {EnhancedIMessage} from "../utils";

type UseCommonChatRenderersProps = {
  chat: Chat | null
  typingData: string[]
  users: Map<string, User>
}

export function useCommonChatRenderers({ chat, typingData, users }: UseCommonChatRenderersProps) {
  const openLink = (link: string) => {
    Linking.openURL(link)
  }

  const renderMessagePart = useCallback(
    (messagePart: MixedTextTypedElement, index: number, userId: string | number) => {
      if (messagePart.type === "text") {
        return (
          <Text
            variant="body"
            color={chat?.currentUser.id ? undefined : "neutral900"}
            key={index}
          >
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
            onPress={() => openLink(`https://pubnub.com/${messagePart.content.id}`)}
          >
            #{messagePart.content.name}
          </Text>
        )
      }

      return null
    },
    [chat?.currentUser]
  )

  const renderFooter = useCallback(() => {
    if (!typingData.length) {
      return null
    }

    if (typingData.length === 1) {
      return (
        <View>
          <Text variant="body">{users.get(typingData[0])?.name || typingData[0]} is typing...</Text>
        </View>
      )
    }

    return (
      <View>
        <Text variant="body">
          {typingData.map((typingPoint) => users.get(typingPoint)?.name || typingPoint).join(", ")}{" "}
          are typing...
        </Text>
      </View>
    )
  }, [typingData, users])

  const renderMessageText = useCallback(
    (props: Bubble<EnhancedIMessage>["props"]) => {
      if (props.currentMessage?.originalPnMessage.getLinkedText()) {
        return (
          <Text variant="body">
            {props.currentMessage.originalPnMessage
              .getLinkedText()
              .map((msgPart, index) =>
                renderMessagePart(msgPart, index, props.currentMessage?.user._id || "")
              )}
          </Text>
        )
      }

      return <Text variant="body">{props.currentMessage?.text}</Text>
    },
    [renderMessagePart]
  )

  return {
    renderMessagePart,
    renderFooter,
    renderMessageText,
  }
}

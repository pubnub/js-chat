import React from "react"
import { StyleSheet, View } from "react-native"
import { colorPalette, Gap, Text } from "../../ui-components"
import { Message } from "@pubnub/chat"

type QuoteProps = {
  message: Message
  onGoToMessage: () => void
  charactersLimit: number
}

export function Quote({ message, onGoToMessage, charactersLimit }: QuoteProps) {
  const getText = () => {
    if (message.text.length > charactersLimit) {
      return (
        <Text variant="body">
          {message.text.substring(0, charactersLimit)}...
          <Text color="sky700" variant="body" onPress={onGoToMessage}>
            Go to message
          </Text>
        </Text>
      )
    }

    return <Text variant="body">{message.text}</Text>
  }

  return (
    <View style={styles.container}>
      <View style={styles.verticalLine} />
      <View style={styles.content}>
        <Text variant="body">{message.userId}</Text>
        <Gap value={8} />
        <Text variant="body">{getText()}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colorPalette.neutral50,
    flexDirection: "row",
    marginRight: 16,
    marginBottom: 16,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  verticalLine: {
    backgroundColor: colorPalette.sky950,
    width: 2,
  },
  content: {
    padding: 12,
  },
})

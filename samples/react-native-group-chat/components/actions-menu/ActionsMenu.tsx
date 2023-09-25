import React, { useCallback, useMemo, useRef, useState } from "react"
import { StyleSheet, TouchableOpacity, View } from "react-native"
import { BottomSheetModal, BottomSheetBackdrop } from "@gorhom/bottom-sheet"
import { Gap, Text, colorPalette as colors, Button } from "../../ui-components"
import Emoji1 from "../../assets/emojis/emoji1.svg"
import Emoji2 from "../../assets/emojis/emoji2.svg"
import Emoji3 from "../../assets/emojis/emoji3.svg"
import Emoji4 from "../../assets/emojis/emoji4.svg"
import Emoji5 from "../../assets/emojis/emoji5.svg"
import Emoji6 from "../../assets/emojis/emoji6.svg"
import { useNavigation } from "@react-navigation/native"
import { EnhancedIMessage } from "../../utils"
import { HomeStackNavigation } from "../../types"
import { Message, ThreadMessage } from "@pubnub/chat"
import * as Clipboard from "expo-clipboard"

type UseActionsMenuParams = {
  onQuote: (message: Message) => void
  removeThreadReply?: boolean
  onPinMessage: (message: Message | ThreadMessage) => void
  onToggleEmoji: (message: Message) => void
}

export function useActionsMenu({
  onQuote,
  removeThreadReply = false,
  onPinMessage,
  onToggleEmoji,
}: UseActionsMenuParams) {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null)
  const navigation = useNavigation<HomeStackNavigation>()
  const [currentlyFocusedMessage, setCurrentlyFocusedMessage] = useState<EnhancedIMessage | null>(
    null
  )

  // variables
  const snapPoints = useMemo(() => ["25%", "50%"], [])

  // callbacks
  const handlePresentModalPress = useCallback(({ message }: { message: EnhancedIMessage }) => {
    setCurrentlyFocusedMessage(message)
    bottomSheetModalRef.current?.present()
  }, [])
  const handleSheetChanges = useCallback((index: number) => {
    console.log("handleSheetChanges", index)
  }, [])

  const handleEmoji = useCallback(
    async (emoji: string) => {
      if (!currentlyFocusedMessage) {
        return null
      }

      onToggleEmoji(await currentlyFocusedMessage.originalPnMessage.toggleReaction(emoji))
    },
    [currentlyFocusedMessage, onToggleEmoji]
  )

  const ActionsMenuComponent = () => (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      index={1}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      style={styles.container}
      backdropComponent={BottomSheetBackdrop}
      handleIndicatorStyle={[styles.handleIndicator, { backgroundColor: colors.neutral500 }]}
    >
      <View style={styles.emojisRow}>
        <TouchableOpacity onPress={() => handleEmoji("🙂")}>
          <Emoji1 width={48} height={48} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleEmoji("☺️")}>
          <Emoji2 width={48} height={48} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleEmoji("👍")}>
          <Emoji3 width={48} height={48} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleEmoji("🎉")}>
          <Emoji4 width={48} height={48} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleEmoji("👋")}>
          <Emoji5 width={48} height={48} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleEmoji("😞")}>
          <Emoji6 width={48} height={48} />
        </TouchableOpacity>
      </View>
      <Gap value={12} />
      <Text variant="headline" textAlign="center">
        Actions
      </Text>
      <Gap value={20} />
      <Button
        size="md"
        align="left"
        icon="content-copy"
        variant="outlined"
        onPress={() => {
          Clipboard.setStringAsync(currentlyFocusedMessage?.originalPnMessage.text || "")
          setCurrentlyFocusedMessage(null)
          bottomSheetModalRef.current?.dismiss()
        }}
      >
        Copy message
      </Button>
      <Gap value={16} />
      {!removeThreadReply ? (
        <>
          <Button
            size="md"
            align="left"
            icon="subdirectory-arrow-right"
            variant="outlined"
            onPress={() => {
              navigation.navigate("ThreadReply", { parentMessage: currentlyFocusedMessage })
              setCurrentlyFocusedMessage(null)
              bottomSheetModalRef.current?.dismiss()
            }}
          >
            Reply in thread
          </Button>
          <Gap value={16} />
        </>
      ) : null}
      <Button
        size="md"
        align="left"
        icon="format-quote"
        variant="outlined"
        onPress={() => {
          if (currentlyFocusedMessage) {
            onQuote(currentlyFocusedMessage.originalPnMessage)
            setCurrentlyFocusedMessage(null)
            bottomSheetModalRef.current?.dismiss()
          }
        }}
      >
        Quote message
      </Button>
      <Gap value={16} />
      <Button
        size="md"
        align="left"
        icon="push-pin"
        variant="outlined"
        onPress={() => {
          if (currentlyFocusedMessage) {
            onPinMessage(currentlyFocusedMessage.originalPnMessage)
            setCurrentlyFocusedMessage(null)
            bottomSheetModalRef.current?.dismiss()
          }
        }}
      >
        Pin message
      </Button>
      <Gap value={16} />
    </BottomSheetModal>
  )

  return {
    ActionsMenuComponent,
    handleSheetChanges,
    handlePresentModalPress,
  }
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 32,
  },
  handleIndicator: {
    width: 32,
    height: 3,
  },
  emojisRow: {
    flexDirection: "row",
  },
})

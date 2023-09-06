import React, { useCallback, useMemo, useRef } from "react"
import { StyleSheet, View } from "react-native"
import { Button as PaperButton } from "react-native-paper"
import ContentCopyIcon from "../../assets/content_copy.svg"
import FormatQuoteIcon from "../../assets/format_quote.svg"
import PushPinIcon from "../../assets/push_pin.svg"
import SubdirectoryArrowRightIcon from "../../assets/subdirectory_arrow_right.svg"
import { BottomSheetModal, BottomSheetBackdrop } from "@gorhom/bottom-sheet"
import { Gap } from "../../ui-components/gap"
import Emoji1 from "../../assets/emojis/emoji1.svg"
import Emoji2 from "../../assets/emojis/emoji2.svg"
import Emoji3 from "../../assets/emojis/emoji3.svg"
import Emoji4 from "../../assets/emojis/emoji4.svg"
import Emoji5 from "../../assets/emojis/emoji5.svg"
import Emoji6 from "../../assets/emojis/emoji6.svg"
import Emoji7 from "../../assets/emojis/emoji7.svg"
import { Text } from "../../ui-components/text"
import { usePNTheme } from "../../ui-components/defaultTheme"

export function useActionsMenu() {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null)
  const theme = usePNTheme()

  // variables
  const snapPoints = useMemo(() => ["25%", "50%"], [])

  // callbacks
  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present()
  }, [])
  const handleSheetChanges = useCallback((index: number) => {
    console.log("handleSheetChanges", index)
  }, [])

  const ActionsMenuComponent = () => (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      index={1}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      style={styles.container}
      backdropComponent={BottomSheetBackdrop}
      handleIndicatorStyle={[styles.handleIndicator, { backgroundColor: theme.colors.neutral500 }]}
    >
      <View style={styles.emojisRow}>
        <Emoji1 width={48} height={48} />
        <Emoji2 width={48} height={48} />
        <Emoji3 width={48} height={48} />
        <Emoji4 width={48} height={48} />
        <Emoji5 width={48} height={48} />
        <Emoji6 width={48} height={48} />
        <Emoji7 width={48} height={48} />
      </View>
      <Gap value={12} />
      <Text variant="headline" textAlign="center">
        Actions
      </Text>
      <Gap value={20} />
      <PaperButton
        icon={() => <ContentCopyIcon width={20} height={20} />}
        mode="contained"
        onPress={() => console.log("Pressed")}
        buttonColor={theme.colors.neutral0}
        textColor={theme.colors.navy700}
        labelStyle={[theme.textStyles.body, { color: theme.colors.navy700 }]}
        style={[styles.buttonStyle, { borderColor: theme.colors.navy300 }]}
        contentStyle={styles.buttonContentStyle}
      >
        Copy message
      </PaperButton>
      <Gap value={16} />
      <PaperButton
        icon={() => <SubdirectoryArrowRightIcon width={20} height={20} />}
        mode="contained"
        onPress={() => console.log("Pressed")}
        buttonColor={theme.colors.neutral0}
        textColor={theme.colors.navy700}
        labelStyle={[theme.textStyles.body, { color: theme.colors.navy700 }]}
        style={[styles.buttonStyle, { borderColor: theme.colors.navy300 }]}
        contentStyle={styles.buttonContentStyle}
      >
        Reply in thread
      </PaperButton>
      <Gap value={16} />
      <PaperButton
        icon={() => <FormatQuoteIcon width={20} height={20} />}
        mode="contained"
        onPress={() => console.log("Pressed")}
        buttonColor={theme.colors.neutral0}
        textColor={theme.colors.navy700}
        labelStyle={[theme.textStyles.body, { color: theme.colors.navy700 }]}
        style={[styles.buttonStyle, { borderColor: theme.colors.navy300 }]}
        contentStyle={styles.buttonContentStyle}
      >
        Quote message
      </PaperButton>
      <Gap value={16} />
      <PaperButton
        icon={() => <PushPinIcon width={20} height={20} />}
        mode="contained"
        onPress={() => console.log("Pressed")}
        buttonColor={theme.colors.neutral0}
        textColor={theme.colors.navy700}
        labelStyle={[theme.textStyles.body, { color: theme.colors.navy700 }]}
        style={[styles.buttonStyle, { borderColor: theme.colors.navy300 }]}
        contentStyle={styles.buttonContentStyle}
      >
        Pin message
      </PaperButton>
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
  buttonStyle: {
    borderWidth: 1,
    borderRadius: 6,
    justifyContent: "center",
    height: 50,
  },
  buttonContentStyle: {
    justifyContent: "flex-start",
  },
  handleIndicator: {
    width: 32,
    height: 3,
  },
  emojisRow: {
    flexDirection: "row",
  },
})

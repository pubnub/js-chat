import React, { useState } from "react"
import { View, StyleSheet } from "react-native"
import { Button, colorPalette, TextInput } from "../../ui-components"

type AddTextLinkBoxProps = {
  onAdd: ({ text, link }: { text: string; link: string }) => void
  onCancel: () => void
}

export function AddTextLinkBox({ onAdd, onCancel }: AddTextLinkBoxProps) {
  const [text, setText] = useState("")
  const [link, setLink] = useState("")

  const handleAddTextLink = () => {
    if (!text || !link) {
      return
    }

    onAdd({ text, link })
  }

  return (
    <View style={styles.container}>
      <TextInput label="Text" value={text} onChangeText={setText} />
      <TextInput label="Link" value={link} onChangeText={setLink} />
      <View style={styles.buttonsContainer}>
        <Button onPress={handleAddTextLink}>Add text link</Button>
        <View style={{ marginRight: 8 }} />
        <Button onPress={onCancel} variant="danger">
          Cancel
        </Button>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colorPalette.neutral0,
    borderRadius: 6,
    position: "absolute",
    bottom: 0,
    left: 16,
    shadowColor: colorPalette.neutral900,
    shadowOpacity: 0.1,
    shadowOffset: {
      width: 2,
      height: 0,
    },
    padding: 16,
  },
  buttonsContainer: {
    marginTop: 8,
    flexDirection: "row",
  },
})

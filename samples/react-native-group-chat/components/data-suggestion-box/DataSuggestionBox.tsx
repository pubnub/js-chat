import React from "react"
import { View, StyleSheet } from "react-native"
import { ListItem } from "../list-item"
import { colorPalette } from "../../ui-components"
import { Channel, User } from "@pubnub/chat"

type DataSuggestionBoxProps = {
  data: Channel[] | User[]
  onSelect: (element: Channel | User) => void
}

export function DataSuggestionBox({ data, onSelect }: DataSuggestionBoxProps) {
  return (
    <View style={styles.container}>
      {data.map((element) => (
        <ListItem
          title={element.name || element.id}
          key={element.id}
          onPress={() => onSelect(element)}
        />
      ))}
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
  },
})

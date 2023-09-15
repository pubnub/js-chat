import React from "react"
import { View, StyleSheet } from "react-native"
import { ListItem } from "../list-item"
import { User } from "@pubnub/chat"
import { colorPalette } from "../../ui-components"

type UserSuggestionBoxProps = {
  users: User[]
  onUserSelect: (user: User) => void
}

export function UserSuggestionBox({ users, onUserSelect }: UserSuggestionBoxProps) {
  return (
    <View style={styles.container}>
      {users.map((user) => (
        <ListItem title={user.name} key={user.id} onPress={() => onUserSelect(user)} />
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

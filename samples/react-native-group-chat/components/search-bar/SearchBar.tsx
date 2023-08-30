import React from "react"
import { Image, TextInput, StyleSheet, View } from "react-native"

type SearchBarProps = {
  onChangeText: (text: string) => void
  value: string
}

export function SearchBar({ onChangeText, value }: SearchBarProps) {
  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/search.png")}
        width={20}
        height={20}
        style={styles.image}
      />
      <TextInput
        placeholder="Search"
        placeholderTextColor="#A3A3A3"
        onChangeText={onChangeText}
        style={styles.input}
        value={value}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FAFAFA",
    flexDirection: "row",
    minHeight: 38,
    alignItems: "center",
    borderRadius: 6,
  },
  image: {
    marginLeft: 13,
    marginRight: 8,
  },
  input: {
    width: "100%",
    height: "100%",
  },
})

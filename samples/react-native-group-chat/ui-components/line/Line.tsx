import React from "react"
import { View, ViewProps } from "react-native"

export function Line(props: ViewProps) {
  const { style, ...rest } = props
  return (
    <View style={[{ width: "100%", height: 1, backgroundColor: "#E2E8F0" }, style]} {...rest} />
  )
}

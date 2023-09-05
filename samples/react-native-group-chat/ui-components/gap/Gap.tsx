import React from "react"
import { View } from "react-native"

type GapProps = {
  value: 4 | 8 | 12 | 16 | 20 | 24 | 28 | 32 | 36 | 40 | 48 | 56 | 64 | 80 | 96 | 112 | 128 | 144
}

export function Gap({ value }: GapProps) {
  return <View style={{ height: value }} />
}

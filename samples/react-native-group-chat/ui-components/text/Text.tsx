import React from "react"
import { Text as RNText, TextProps as RNTextProps, StyleProp, TextStyle } from "react-native"

import { defaultTheme, colorPalette } from "../defaultTheme"

export type Variant = "headline" | "body" | "smallBody" | "label" | "smallLabel"

type TextProps = {
  variant: Variant
  fontFamily?: "Roboto_400Regular" | "Roboto_500Medium" | "Roboto_700Bold"
  color?: keyof typeof colorPalette
  textAlign?: "auto" | "left" | "right" | "center" | "justify" | undefined
} & Omit<RNTextProps, "style">

export function Text({ variant = "body", fontFamily, color, textAlign, ...textProps }: TextProps) {
  const textStyles = defaultTheme.textStyles[variant]

  if (!textStyles) {
    throw `Unknown text variant: ${variant}`
  }

  const additionalStyles: StyleProp<TextStyle> = {}

  if (fontFamily) {
    additionalStyles.fontFamily = fontFamily
  }
  if (color) {
    additionalStyles.color = colorPalette[color]
  }
  if (textAlign) {
    additionalStyles.textAlign = textAlign
  }

  return <RNText {...textProps} style={[textStyles, additionalStyles]} />
}

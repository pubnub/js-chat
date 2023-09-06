import React from "react"
import { Text as RNText, TextProps as RNTextProps } from "react-native"
import { defaultTheme, colorPalette } from "../defaultTheme"
import { StyleProp } from "react-native/Libraries/StyleSheet/StyleSheet"
import { TextStyle } from "react-native/Libraries/StyleSheet/StyleSheetTypes"

export type Variant = "headline" | "body" | "smallBody" | "label"

type TextProps = {
  variant: Variant
  fontFamily?: "Roboto-Bold" | "Roboto-Regular" | "Roboto-Medium"
  color?: keyof typeof colorPalette
  textAlign?: "auto" | "left" | "right" | "center" | "justify" | undefined
} & Omit<RNTextProps, "style">

export function Text({ variant, fontFamily, color, textAlign, ...textProps }: TextProps) {
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

import React from "react"
import { Text as RNText, TextProps as RNTextProps } from "react-native"
import { defaultTheme } from "../defaultTheme"

export type Variant = "headline" | "body" | "smallBody" | "label"

type TextProps = {
  variant: Variant
} & Omit<RNTextProps, "style">

export function Text({ variant, ...textProps }: TextProps) {
  const textStyles = defaultTheme.textStyles[variant]

  if (!textStyles) {
    throw `Unknown text variant: ${variant}`
  }

  return <RNText {...textProps} style={textStyles} />
}

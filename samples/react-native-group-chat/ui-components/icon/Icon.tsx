import React from "react"
import { StyleSheet } from "react-native"
import { IconButton } from "react-native-paper"
import { IconSource } from "react-native-paper/lib/typescript/components/Icon"
import { colorPalette, usePNTheme } from "../defaultTheme"

type IconProps = {
  icon: IconSource
  iconColor?: keyof typeof colorPalette
}

export function Icon({ icon, iconColor }: IconProps) {
  const theme = usePNTheme()

  return (
    <IconButton
      icon={icon}
      style={styles.container}
      iconColor={iconColor ? theme.colors[iconColor] : undefined}
    />
  )
}

const styles = StyleSheet.create({
  container: {
    width: 24,
    height: 24,
  },
})

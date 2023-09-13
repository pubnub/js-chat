import { TextStyle } from "react-native"
import { useTheme, MD3LightTheme as DefaultTheme } from "react-native-paper"

export const colorPalette = {
  sky50: "#F0F9FF",
  sky100: "#E0F2FE",
  sky150: "#49A5E3",
  sky700: "#0369A1",
  sky800: "#075985",
  sky900: "#0C4A6E",
  sky950: "#132F47",
  neutral0: "#FFFFFF",
  neutral50: "#FAFAFA",
  neutral100: "#F5F5F5",
  neutral200: "#E5E5E5",
  neutral300: "#D4D4D4",
  neutral400: "#A3A3A3",
  neutral500: "#737373",
  neutral600: "#525252",
  neutral700: "#404040",
  neutral800: "#262626",
  neutral900: "#171717",
  navy50: "#F8FAFC",
  navy100: "#F1F5F9",
  navy200: "#E2E8F0",
  navy300: "#CBD5E1",
  navy500: "#64748B",
  navy700: "#334155",
  navy800: "#1E293B",
  navy900: "#161C2D",
  checkbox: "#065B6A",
  success: "#22C55E",
  teal100: "#D1E4E5",
  teal700: "#216F7B",
  badge: "#B91C1C",
}

const textStyles = {
  headline: {
    fontSize: 18,
    lineHeight: 28,
    color: colorPalette.neutral900,
    fontFamily: "Roboto_700Bold",
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: colorPalette.neutral900,
    fontFamily: "Roboto_400Regular",
  },
  smallBody: {
    fontSize: 14,
    lineHeight: 24,
    color: colorPalette.neutral900,
    fontFamily: "Roboto_400Regular",
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    color: colorPalette.neutral900,
    fontFamily: "Roboto_500Medium",
  },
  smallLabel: {
    fontSize: 12,
    lineHeight: 20,
    color: colorPalette.neutral900,
    fontFamily: "Roboto_400Regular",
  },
} as { [variant: string]: TextStyle }

export const defaultTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    ...colorPalette,
    primary: colorPalette.neutral900,
  },
  textStyles,
}

export function usePNTheme() {
  return useTheme() as typeof defaultTheme
}

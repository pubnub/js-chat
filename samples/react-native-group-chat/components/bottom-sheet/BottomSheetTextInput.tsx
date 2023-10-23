import React from "react"
import { BottomSheetTextInput as GorhomBottomSheetTextInput } from "@gorhom/bottom-sheet"
import { MaterialIcons } from "@expo/vector-icons"
import { StyleSheet, View, ViewStyle } from "react-native"
import { TextInputProps as RNTextInputProps } from "react-native/Libraries/Components/TextInput/TextInput"
import { colorPalette as colors, Gap, Text } from "../../ui-components"

type BottomSheetTextInputProps = {
  label?: string
  icon?: keyof typeof MaterialIcons.glyphMap
  variant?: "base" | "search"
  containerStyle?: ViewStyle
}

export const BottomSheetTextInput = ({
  variant = "base",
  label,
  icon,
  containerStyle,
  style,
  ...rest
}: BottomSheetTextInputProps & RNTextInputProps) => {
  const styles = createStyles({ variant })
  return (
    <View style={containerStyle}>
      {label ? (
        <>
          <Text variant="smallBody">{label}</Text>
          <Gap value={4} />
        </>
      ) : null}
      <View style={styles.wrapper}>
        <MaterialIcons name={icon} size={20} style={styles.icon} color={colors.neutral600} />
        <GorhomBottomSheetTextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.neutral400}
          {...rest}
        />
      </View>
    </View>
  )
}

const createStyles = ({ variant }: Required<Pick<BottomSheetTextInputProps, "variant">>) =>
  StyleSheet.create({
    wrapper: {
      alignItems: "center",
      borderRadius: 6,
      borderWidth: 1,
      flexDirection: "row",
      justifyContent: "center",
      paddingHorizontal: 12,
      borderColor: variant === "base" ? colors.navy300 : colors.neutral50,
      height: variant === "base" ? 48 : 42,
      backgroundColor: variant === "base" ? undefined : colors.neutral50,
    },
    icon: {
      marginRight: 8,
    },
    input: {
      alignSelf: "stretch",
      flex: 1,
      fontFamily: "Roboto_400Regular",
      fontSize: 16,
    },
  })

import {
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  View,
  StyleSheet,
  StyleProp,
} from "react-native"
import { Gap } from "../gap"
import { Text } from "../text"
import { colorPalette as colors } from "../defaultTheme"
import { MaterialIcons } from "@expo/vector-icons"

type TextInputProps = {
  label: string
  icon: string
  variant: "base" | "search"
  containerStyle: StyleProp<View>
}

export function TextInput({
  variant = "base",
  label,
  icon,
  containerStyle,
  style,
  ...rest
}: TextInputProps & RNTextInputProps) {
  return (
    <View style={[containerStyle]}>
      {label ? (
        <>
          <Text variant="smallBody">{label}</Text>
          <Gap value={6} />
        </>
      ) : null}
      <View style={[styles.wrapper["all"], styles.wrapper[variant]]}>
        <MaterialIcons name={icon} size={20} style={styles.icon} color={colors.neutral600} />
        <RNTextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.neutral400}
          {...rest}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    all: {
      alignItems: "center",
      borderRadius: 6,
      borderWidth: 1,
      flexDirection: "row",
      justifyContent: "center",
      paddingHorizontal: 12,
    },
    base: {
      borderColor: colors.navy300,
      height: 48,
    },
    search: {
      backgroundColor: colors.neutral50,
      borderColor: colors.neutral50,
      height: 42,
    },
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

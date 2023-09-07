import {
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  View,
  StyleSheet,
  StyleProp,
} from "react-native"
import { Gap, Text, colorPalette as colors } from ".."

type TextInputProps = {
  label: string
  containerStyle: StyleProp<View>
}

export function TextInput({
  label,
  containerStyle,
  style,
  ...rest
}: TextInputProps & RNTextInputProps) {
  return (
    <View style={containerStyle}>
      <Text variant="body">{label}</Text>
      <Gap value={6} />
      <RNTextInput style={[styles.input, style]} {...rest} />
    </View>
  )
}

const styles = StyleSheet.create({
  input: {
    borderColor: colors.navy300,
    borderRadius: 6,
    borderWidth: 2,
    height: 48,
    paddingHorizontal: 20,
  },
})

import { TouchableHighlight, TouchableHighlightProps, StyleSheet, View } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { Text } from "../text"
import { colorPalette as colors } from "../defaultTheme"

type ButtonProps = {
  variant?: "base" | "outlined" | "danger"
  size?: "lg" | "md" | "sm"
  align?: "center" | "left"
  icon?: string
}

export function Button(props: ButtonProps & TouchableHighlightProps) {
  const {
    variant = "base",
    size = "lg",
    align = "center",
    children,
    icon,
    style,
    disabled,
    ...rest
  } = props

  return (
    <TouchableHighlight
      disabled={disabled}
      style={[styles.container[disabled ? "disabled" : variant], styles.container[size], style]}
      underlayColor={variant === "base" ? colors.navy800 : colors.navy100}
      {...rest}
    >
      <View style={styles.wrapper[align]}>
        {icon ? (
          <MaterialIcons
            name={icon}
            color={
              {
                base: colors.neutral50,
                danger: colors.badge,
                outlined: colors.navy700,
              }[variant]
            }
            size={20}
            style={styles.icon}
          />
        ) : null}
        <Text
          variant={size === "sm" ? "smallBody" : "body"}
          color={{ base: "neutral50", danger: "badge", outlined: "navy700" }[variant]}
          style={{ flex: 1, width: "100%" }}
        >
          {children}
        </Text>
      </View>
    </TouchableHighlight>
  )
}

const styles = StyleSheet.create({
  container: {
    disabled: {
      backgroundColor: colors.navy300,
      borderColor: colors.navy300,
      borderRadius: 6,
      borderWidth: 1,
      justifyContent: "center",
    },
    base: {
      backgroundColor: colors.navy900,
      borderRadius: 6,
      borderWidth: 1,
      justifyContent: "center",
    },
    outlined: {
      borderColor: colors.navy300,
      borderRadius: 6,
      borderWidth: 1,
      justifyContent: "center",
    },
    danger: {
      borderColor: colors.navy300,
      borderRadius: 6,
      borderWidth: 1,
      justifyContent: "center",
    },
    lg: {
      height: 50,
      paddingHorizontal: 28,
    },
    md: {
      height: 42,
      paddingHorizontal: 24,
    },
    sm: {
      height: 38,
      paddingHorizontal: 16,
    },
  },
  wrapper: {
    left: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
    },
    center: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
  },
  icon: {
    width: 20,
    height: 20,
    marginLeft: -2,
    marginRight: 10,
  },
})

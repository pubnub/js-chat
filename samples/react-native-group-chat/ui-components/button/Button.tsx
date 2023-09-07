import { TouchableHighlight, TouchableHighlightProps, StyleSheet, View } from "react-native"
import { IconButton } from "react-native-paper"
import { Text } from ".."
import { colorPalette as colors } from "../defaultTheme"

type ButtonProps = {
  variant?: "base" | "outlined" | "danger"
  size?: "lg" | "md" | "sm"
  align?: "center" | "left"
  icon?: string
}

export function Button(props: ButtonProps & TouchableHighlightProps) {
  const { variant = "base", size = "lg", align = "center", children, icon, style, ...rest } = props

  return (
    <TouchableHighlight
      style={[styles.container[variant], styles.container[size], style]}
      underlayColor={variant === "base" ? colors.navy800 : colors.navy100}
      {...rest}
    >
      <View style={styles.wrapper[align]}>
        {icon ? (
          <IconButton
            icon={icon}
            iconColor={
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
          variant={size === "lg" ? "body" : "smallBody"}
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
    base: {
      backgroundColor: colors.navy900,
      borderRadius: 6,
      borderWidth: 2,
      justifyContent: "center",
    },
    outlined: {
      borderColor: colors.navy300,
      borderRadius: 6,
      borderWidth: 2,
      justifyContent: "center",
    },
    danger: {
      borderColor: colors.navy300,
      borderRadius: 6,
      borderWidth: 2,
      justifyContent: "center",
    },
    lg: {
      height: 64,
      paddingHorizontal: 28,
    },
    md: {
      height: 48,
      paddingHorizontal: 24,
    },
    sm: {
      height: 40,
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
    marginLeft: -4,
  },
})

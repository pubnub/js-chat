import { TouchableHighlight, TouchableHighlightProps, StyleSheet, View } from "react-native"
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons"
import { Text } from "../text"
import { colorPalette as colors } from "../defaultTheme"

type ButtonProps = {
  variant?: "base" | "outlined" | "danger" | "list"
  disabled?: boolean
  size?: "lg" | "md" | "sm"
  align?: "center" | "left"
  icon?: keyof typeof MaterialIcons.glyphMap
  iconCommunity?: keyof typeof MaterialCommunityIcons.glyphMap
  iconRight?: keyof typeof MaterialIcons.glyphMap
  iconRightCommunity?: keyof typeof MaterialCommunityIcons.glyphMap
}

export function Button(props: ButtonProps & TouchableHighlightProps) {
  const {
    variant = "base",
    size = "lg",
    align = "center",
    children,
    icon,
    iconCommunity,
    iconRight,
    iconRightCommunity,
    style,
    disabled = false,
    ...rest
  } = props

  const styles = createStyles({ variant, size, disabled, align })

  return (
    <TouchableHighlight
      disabled={disabled}
      style={[styles.container, style]}
      underlayColor={variant === "base" ? colors.navy800 : colors.navy100}
      {...rest}
    >
      <View style={styles.wrapper}>
        {icon && <MaterialIcons name={icon} size={20} style={styles.icon} />}
        {iconCommunity && (
          <MaterialCommunityIcons name={iconCommunity} size={20} style={styles.icon} />
        )}

        <View style={align === "left" && { flex: 1 }}>
          <Text
            variant={size === "sm" ? "smallBody" : "body"}
            color={
              {
                base: "neutral50" as const,
                danger: "badge" as const,
                outlined: "navy700" as const,
                list: "neutral900" as const,
              }[variant]
            }
          >
            {children}
          </Text>
        </View>

        {iconRight && <MaterialIcons name={iconRight} size={20} style={[styles.iconRight]} />}
        {iconRightCommunity && (
          <MaterialCommunityIcons name={iconRightCommunity} size={20} style={[styles.iconRight]} />
        )}
      </View>
    </TouchableHighlight>
  )
}

const createStyles = ({
  variant,
  size,
  disabled,
  align,
}: Required<Pick<ButtonProps, "variant" | "size" | "disabled" | "align">>) =>
  StyleSheet.create({
    container: {
      justifyContent: "center",
      backgroundColor: disabled
        ? colors.navy300
        : variant === "base"
        ? colors.navy900
        : colors.neutral0,
      borderColor: disabled
        ? colors.navy300
        : ["danger", "outlined"].includes(variant)
        ? colors.navy300
        : colors.navy900,
      borderRadius: variant === "list" ? 0 : 6,
      borderWidth: variant === "list" ? 0 : 1,
      height: { lg: 50, md: 42, sm: 38 }[size],
      paddingHorizontal: { lg: 28, md: 24, sm: 16 }[size],
    },
    wrapper: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: align === "center" ? "center" : "flex-start",
    },
    icon: {
      marginLeft: -2,
      marginRight: 10,
      color: {
        base: colors.neutral50,
        danger: colors.badge,
        outlined: colors.navy700,
        list: colors.teal800,
      }[variant],
    },
    iconRight: {
      marginLeft: 10,
    },
  })

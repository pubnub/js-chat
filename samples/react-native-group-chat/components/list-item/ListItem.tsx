import { View, StyleSheet, TouchableHighlight } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"

import { Text, colorPalette as colors, RandomAvatar } from "../../ui-components"

type ListItemProps = {
  title: string
  showActive?: boolean
  active?: boolean
  badge?: string
  onPress?: () => unknown
  showCheckbox?: boolean
  checked?: boolean
}

export function ListItem({
  title,
  showActive,
  active,
  badge,
  onPress,
  showCheckbox,
  checked,
}: ListItemProps) {
  return (
    <TouchableHighlight style={styles.touchable} onPress={onPress} underlayColor={colors.navy100}>
      <View style={styles.wrapper}>
        {showCheckbox ? (
          <MaterialIcons
            color={checked ? colors.teal800 : colors.neutral400}
            size={20}
            style={styles.checkbox}
            name={checked ? "check-box" : "check-box-outline-blank"}
          />
        ) : null}

        <RandomAvatar />
        {showActive ? (
          <View
            style={[
              styles.indicator,
              { backgroundColor: active ? colors.success : colors.neutral300 },
            ]}
          ></View>
        ) : null}

        <View style={styles.title}>
          <Text variant="smallBody">{title}</Text>
        </View>

        {badge ? (
          <View style={styles.badge}>
            <Text color="neutral0">5</Text>
          </View>
        ) : null}
      </View>
    </TouchableHighlight>
  )
}

const styles = StyleSheet.create({
  touchable: {
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  wrapper: {
    alignItems: "center",
    flexDirection: "row",
  },
  indicator: {
    borderColor: colors.neutral0,
    borderRadius: 12,
    borderWidth: 2,
    bottom: -1,
    height: 12,
    left: 21,
    position: "absolute",
    width: 12,
  },
  checkbox: {
    paddingRight: 12,
  },
  title: {
    flex: 1,
    paddingHorizontal: 16,
  },
  badge: {
    backgroundColor: colors.badge,
    borderRadius: 15,
    paddingHorizontal: 12,
  },
})

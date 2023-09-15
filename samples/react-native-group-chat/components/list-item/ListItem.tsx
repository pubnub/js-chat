import { ReactNode } from "react"
import { View, StyleSheet, TouchableHighlight } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"

import { Text, colorPalette as colors } from "../../ui-components"

type ListItemProps = {
  title: string
  avatar?: ReactNode
  badge?: string
  onPress?: () => unknown
  showCheckbox?: boolean
  checked?: boolean
}

export function ListItem({ title, avatar, badge, onPress, showCheckbox, checked }: ListItemProps) {
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

        {avatar}

        <View style={styles.title}>
          <Text variant="smallBody">{title}</Text>
        </View>

        {badge ? (
          <View style={styles.badge}>
            <Text variant="body" color="neutral0">
              5
            </Text>
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
  checkbox: {
    paddingRight: 12,
  },
  title: {
    paddingHorizontal: 16,
  },
  badge: {
    backgroundColor: colors.badge,
    borderRadius: 15,
    paddingHorizontal: 12,
  },
})

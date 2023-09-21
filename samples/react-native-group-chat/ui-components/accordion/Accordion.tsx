import { ReactNode, useState } from "react"
import { View, StyleSheet, TouchableOpacity } from "react-native"

import { Text } from "../text"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { colorPalette } from "../defaultTheme"

type AccordionProps = {
  title: string
  icons?: ReactNode
  children: ReactNode
}

export function Accordion({ title, children, icons, ...rest }: AccordionProps) {
  const [expanded, setExpanded] = useState(true)

  return (
    <View {...rest}>
      <View style={styles.row}>
        <Text variant="label">{title}</Text>
        <View style={{ flexDirection: "row" }}>
          {icons}
          <TouchableOpacity onPress={() => setExpanded(!expanded)}>
            <MaterialCommunityIcons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={24}
              color={colorPalette.neutral400}
            />
          </TouchableOpacity>
        </View>
      </View>
      {expanded && children}
    </View>
  )
}
const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
})

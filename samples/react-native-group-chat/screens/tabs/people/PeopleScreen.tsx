import React, { useContext, useState } from "react"
import { ScrollView, View, StyleSheet, TouchableOpacity } from "react-native"
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs"
import { MaterialIcons } from "@expo/vector-icons"

import { BottomTabsParamList } from "../../../types"
import { ChatContext } from "../../../context"
import { DirectChannels } from "../../../components"
import { Gap, Line, TextInput, Button, Text, colorPalette as colors } from "../../../ui-components"

export function PeopleScreen({}: BottomTabScreenProps<BottomTabsParamList, "People">) {
  const { chat } = useContext(ChatContext)
  const [searchText, setSearchText] = useState("")
  const [tooltipShown, setTooltipShown] = useState(false)
  const [sortByActive, setSortByActive] = useState(true)

  return (
    chat && (
      <ScrollView style={styles.container}>
        <TextInput
          onChangeText={setSearchText}
          value={searchText}
          placeholder="Search"
          icon="search"
          variant="search"
        />

        <Gap value={20} />
        <Line />
        <Gap value={20} />

        <View style={[styles.row, { zIndex: 1 }]}>
          <Text variant="label">DIRECT MESSAGES</Text>

          <TouchableOpacity onPress={() => setTooltipShown(!tooltipShown)}>
            <MaterialIcons name="sort" size={20} color={colors.neutral400} />
          </TouchableOpacity>

          {tooltipShown ? (
            <View style={styles.tooltip}>
              <View style={{ paddingHorizontal: 16, paddingBottom: 6 }}>
                <Text variant="smallLabel" color="neutral500">
                  Sort by
                </Text>
              </View>
              <Button
                variant="list"
                size="sm"
                align="left"
                onPress={() => {
                  setSortByActive(true)
                  setTooltipShown(false)
                }}
                iconRight={sortByActive ? "check" : undefined}
              >
                Active
              </Button>
              <Button
                variant="list"
                size="sm"
                align="left"
                onPress={() => {
                  setSortByActive(false)
                  setTooltipShown(false)
                }}
                iconRight={sortByActive ? undefined : "check"}
              >
                Name
              </Button>
            </View>
          ) : null}
        </View>

        <Gap value={20} />

        <DirectChannels sortByActive={sortByActive} searchText={searchText} showIndicators />

        <Gap value={32} />
      </ScrollView>
    )
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.neutral0,
    padding: 16,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  tooltip: {
    backgroundColor: colors.neutral0,
    borderColor: colors.neutral300,
    borderRadius: 6,
    borderWidth: 1,
    elevation: 10,
    paddingVertical: 6,
    position: "absolute",
    right: 0,
    shadowColor: colors.neutral600,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    top: 30,
    width: "50%",
  },
})

import React from "react";
import { View } from "react-native";
import { DimensionValue } from "react-native/Libraries/StyleSheet/StyleSheetTypes";

type GapProps = {
  padding?: DimensionValue | undefined;
  paddingBottom?: DimensionValue | undefined;
  paddingEnd?: DimensionValue | undefined;
  paddingHorizontal?: DimensionValue | undefined;
  paddingLeft?: DimensionValue | undefined;
  paddingRight?: DimensionValue | undefined;
  paddingStart?: DimensionValue | undefined;
  paddingTop?: DimensionValue | undefined;
  paddingVertical?: DimensionValue | undefined;
}

export function Gap(props: GapProps) {
  return <View style={props} />
}

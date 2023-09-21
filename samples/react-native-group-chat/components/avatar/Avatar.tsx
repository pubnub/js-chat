import { Channel, User } from "@pubnub/chat"
import { View, Image, StyleSheet, ViewStyle } from "react-native"

import Avatar1 from "../../assets/avatars/avatar1.png"
import Avatar2 from "../../assets/avatars/avatar2.png"
import Avatar3 from "../../assets/avatars/avatar3.png"
import Avatar4 from "../../assets/avatars/avatar4.png"
import Avatar5 from "../../assets/avatars/avatar5.png"
import Avatar6 from "../../assets/avatars/avatar6.png"
import Avatar7 from "../../assets/avatars/avatar7.png"
import Avatar8 from "../../assets/avatars/avatar8.png"
import Avatar9 from "../../assets/avatars/avatar9.png"
import Avatar10 from "../../assets/avatars/avatar10.png"
import Avatar11 from "../../assets/avatars/avatar11.png"
import Avatar12 from "../../assets/avatars/avatar12.png"
import Avatar13 from "../../assets/avatars/avatar13.png"
import Avatar14 from "../../assets/avatars/avatar14.png"
import Avatar15 from "../../assets/avatars/avatar15.png"
import Avatar16 from "../../assets/avatars/avatar16.png"
import { colorPalette as colors } from "../../ui-components"

const avatars = [
  Avatar1,
  Avatar2,
  Avatar3,
  Avatar4,
  Avatar5,
  Avatar6,
  Avatar7,
  Avatar8,
  Avatar9,
  Avatar10,
  Avatar11,
  Avatar12,
  Avatar13,
  Avatar14,
  Avatar15,
  Avatar16,
]

type AvatarProps = {
  source: User | Channel
  showIndicator?: boolean
  size?: "sm" | "md" | "lg" | "xl"
  style?: ViewStyle
}

export function Avatar({ source, showIndicator = false, size = "sm", style }: AvatarProps) {
  const isUser = source && "active" in source
  const hash = source.id
    .split("")
    .map((c) => c.charCodeAt(0))
    .reduce((a, b) => a + b)
  const styles = createStyles({ size })

  return (
    <View style={style}>
      <Image
        style={styles.image}
        source={
          isUser
            ? avatars[hash % avatars.length]
            : { uri: `https://api.dicebear.com/7.x/rings/png?seed=${source.id}` }
        }
      />
      {isUser && showIndicator && (
        <View
          style={[
            styles.indicator,
            { backgroundColor: source.active ? colors.success : colors.neutral300 },
          ]}
        />
      )}
    </View>
  )
}

function createStyles({ size }: Required<Pick<AvatarProps, "size">>) {
  return StyleSheet.create({
    image: {
      width: { sm: 27, md: 36, lg: 64, xl: 88 }[size],
      height: { sm: 27, md: 36, lg: 64, xl: 88 }[size],
      borderRadius: { sm: 27, md: 36, lg: 64, xl: 88 }[size],
    },
    indicator: {
      borderColor: colors.neutral0,
      borderRadius: { sm: 12, md: 18, lg: 22, xl: 64 }[size],
      borderWidth: { sm: 2, md: 3, lg: 3, xl: 4 }[size],
      top: { sm: 16, md: 20, lg: 42, xl: 64 }[size],
      height: { sm: 12, md: 18, lg: 22, xl: 28 }[size],
      position: "absolute",
      left: { sm: 16, md: 20, lg: 42, xl: 64 }[size],
      width: { sm: 12, md: 18, lg: 22, xl: 28 }[size],
    },
  })
}

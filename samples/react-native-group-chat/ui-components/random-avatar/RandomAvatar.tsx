import React, { useMemo } from "react"
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
import { Avatar } from "react-native-paper"
import { StyleSheet } from "react-native"

const avatars = {
  1: Avatar1,
  2: Avatar2,
  3: Avatar3,
  4: Avatar4,
  5: Avatar5,
  6: Avatar6,
  7: Avatar7,
  8: Avatar8,
  9: Avatar9,
  10: Avatar10,
  11: Avatar11,
  12: Avatar12,
  13: Avatar13,
  14: Avatar14,
  15: Avatar15,
  16: Avatar16,
}

export function getRandomAvatar() {
  return avatars[Math.floor(Math.random() * 17) as keyof typeof avatars]
}

export function RandomAvatar() {
  const randomSource = useMemo(() => {
    return getRandomAvatar()
  }, [])

  return <Avatar.Image size={27} style={styles.avatar} source={randomSource} />
}

const styles = StyleSheet.create({
  avatar: {
    marginLeft: 16,
    width: 27,
    height: 27,
  },
})

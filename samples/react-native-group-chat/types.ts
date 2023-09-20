import type { StackScreenProps } from "@react-navigation/stack"
import { NavigationProp, NavigatorScreenParams } from "@react-navigation/native"

import { EnhancedIMessage } from "./utils"

export type RootStackParamList = {
  login: undefined
  tabs: { name: string }
}

export type HomeStackParamList = {
  Home: { name: string }
  Chat: undefined
  NewChat: undefined
  NewGroup: undefined
  ThreadReply: { parentMessage: EnhancedIMessage }
  ChatSettings: undefined
  PinnedMessage: undefined
}

export type HomeStackNavigation = NavigationProp<HomeStackParamList>

export type BottomTabsParamList = {
  HomeStack: NavigatorScreenParams<HomeStackParamList> & { name: string }
  People: undefined
  Mentions: undefined
  Profile: undefined
}

export type NavigationProps = StackScreenProps<RootStackParamList, "login", "tabs">

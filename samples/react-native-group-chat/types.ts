import type { StackScreenProps } from "@react-navigation/stack"
import { NavigatorScreenParams } from "@react-navigation/native"

export type RootStackParamList = {
  login: undefined
  tabs: { name: string }
}

export type HomeStackParamList = {
  Home: { name: string }
  Chat: { channelId: string }
  NewChat: undefined
  NewGroup: undefined
}

export type BottomTabsParamList = {
  HomeStack: NavigatorScreenParams<HomeStackParamList> & { name: string }
  People: undefined
  Mentions: undefined
  Profile: undefined
}

export type NavigationProps = StackScreenProps<RootStackParamList, "login", "tabs">

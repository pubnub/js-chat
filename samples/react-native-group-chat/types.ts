import type { StackScreenProps } from "@react-navigation/stack"
import { NavigatorScreenParams } from "@react-navigation/native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { NavigationProp } from "@react-navigation/native"
import { EnhancedIMessage } from "./utils"

export type RootStackParamList = {
  login: undefined
  tabs: { name: string }
}

export type HomeStackParamList = {
  Home: { name: string }
  Chat: { channelId: string }
  NewChat: undefined
  NewGroup: undefined
  ThreadReply: { parentMessage: EnhancedIMessage }
}

export type HomeStackNavigation = NavigationProp<HomeStackParamList>

export type BottomTabsParamList = {
  HomeStack: NavigatorScreenParams<HomeStackParamList> & { name: string }
  People: undefined
  Mentions: undefined
  Profile: undefined
}

export type NavigationProps = StackScreenProps<RootStackParamList, "login", "tabs">

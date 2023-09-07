import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { NavigatorScreenParams } from "@react-navigation/native";
import { EnhancedIMessage } from "./utils"

export type RootStackParamList = {
  login: undefined
  tabs: { name: string }
}

export type HomeStackParamList = {
  Home: { name: string }
  Chat: { channelId: string }
  ThreadReply: { parentMessage: EnhancedIMessage }
}

export type BottomTabsParamList = {
  HomeStack: NavigatorScreenParams<HomeStackParamList> & { name: string }
  People: undefined
  Mentions: undefined
  Profile: undefined
}

export type NavigationProps = NativeStackScreenProps<RootStackParamList, "login", "tabs">

import React from "react"
import { createNativeStackNavigator, NativeStackScreenProps } from "@react-navigation/native-stack"
import { ChatScreen } from "../../ordinary/chat"
import { HomeScreen } from "./HomeScreen"
import { BottomTabsParamList, HomeStackParamList } from "../../../types"
import { ThreadReply } from "../../ordinary/thread-reply"

const HomeStack = createNativeStackNavigator<HomeStackParamList>()

export function HomeStackScreen({
  route,
}: NativeStackScreenProps<BottomTabsParamList, "HomeStack">) {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen
        name="Home"
        component={HomeScreen}
        initialParams={{ name: route.params.name }}
      />
      <HomeStack.Screen name="Chat" component={ChatScreen} />
      <HomeStack.Screen name="ThreadReply" component={ThreadReply} />
    </HomeStack.Navigator>
  )
}

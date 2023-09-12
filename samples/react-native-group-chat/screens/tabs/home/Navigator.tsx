import React from "react"
import { createStackNavigator, StackScreenProps } from "@react-navigation/stack"

import { ChatScreen, NewChatScreen, NewGroupScreen } from "../../ordinary"
import { BottomTabsParamList, HomeStackParamList } from "../../../types"
import { colorPalette as colors } from "../../../ui-components"
import { HomeScreen } from "./HomeScreen"

const HomeStack = createStackNavigator<HomeStackParamList>()

export function HomeStackScreen({ route }: StackScreenProps<BottomTabsParamList, "HomeStack">) {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: {
          height: 64,
          backgroundColor: colors.navy900,
        },
        headerStatusBarHeight: 0, // there's some extra padding on top of the header without this
        headerTintColor: colors.neutral0,
      }}
    >
      <HomeStack.Screen
        name="Home"
        component={HomeScreen}
        initialParams={{ name: route.params.name }}
        options={{}}
      />
      <HomeStack.Screen name="Chat" component={ChatScreen} />
      <HomeStack.Screen name="NewChat" component={NewChatScreen} options={{ title: "New chat" }} />
      <HomeStack.Screen
        name="NewGroup"
        component={NewGroupScreen}
        options={{ title: "Group chat" }}
      />
    </HomeStack.Navigator>
  )
}

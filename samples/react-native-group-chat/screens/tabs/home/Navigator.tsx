import React, { useContext } from "react"
import { StackScreenProps } from "@react-navigation/stack"
import { View } from "react-native"
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons"

import { BottomTabsParamList, RootStackParamList } from "../../../types"
import { Text, colorPalette as colors } from "../../../ui-components"
import { ChatContext } from "../../../context"
import { Avatar } from "../../../components"
import { HomeScreen } from "./HomeScreen"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { MentionsScreen } from "../mentions"
import { ProfileScreen } from "../profile"

const Tab = createBottomTabNavigator<BottomTabsParamList>()

export function HomeStackScreen({ route }: StackScreenProps<RootStackParamList, "HomeStack">) {
  const { chat } = useContext(ChatContext)

  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          height: 64,
          backgroundColor: colors.navy900,
        },
        headerStatusBarHeight: 0, // there's some extra padding on top of the header without this
        headerTintColor: colors.neutral0,
        tabBarStyle: { backgroundColor: colors.navy50 },
        tabBarActiveTintColor: colors.neutral900,
        tabBarInactiveTintColor: colors.navy500,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        initialParams={{ name: route.params.name }}
        options={() => ({
          title: "",
          headerLeft: () =>
            chat?.currentUser && (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Avatar
                  source={chat?.currentUser}
                  style={{ marginLeft: 26, marginRight: 16 }}
                  size="md"
                />
                <Text variant="headline" color="neutral0">
                  {chat.currentUser.name}
                </Text>
              </View>
            ),
          tabBarLabel: "Home",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="home-outline" size={24} color={color} />
          ),
        })}
      />
      <Tab.Screen
        name="Mentions"
        component={MentionsScreen}
        options={{
          tabBarLabel: "Mentions",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="alternate-email" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="person-outline" size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  )
}

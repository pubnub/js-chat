import React, { useContext } from "react"
import { createStackNavigator, StackScreenProps } from "@react-navigation/stack"
import { View, TouchableHighlight } from "react-native"

import { BottomTabsParamList, HomeStackParamList } from "../../../types"
import { Text, colorPalette as colors } from "../../../ui-components"
import { ChatContext } from "../../../context"
import { Avatar } from "../../../components"
import { HomeScreen } from "./HomeScreen"
import {
  ChatScreen,
  NewChatScreen,
  NewGroupScreen,
  ThreadReply,
  ChatSettings,
  PinnedMessage,
} from "../../ordinary"

const HomeStack = createStackNavigator<HomeStackParamList>()

export function HomeStackScreen({ route }: StackScreenProps<BottomTabsParamList, "HomeStack">) {
  const { chat, currentChannel, currentChannelMembers } = useContext(ChatContext)
  const interlocutor =
    currentChannel?.type === "direct" &&
    currentChannelMembers.map((m) => m.user).filter((u) => u.id !== chat?.currentUser.id)[0]

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
      <HomeStack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ navigation }) => ({
          headerTitle: () =>
            currentChannel && (
              <TouchableHighlight
                underlayColor={colors.navy700}
                onPress={() => navigation.navigate("ChatSettings")}
                style={{ paddingVertical: 8, paddingHorizontal: 30, borderRadius: 6 }}
              >
                <View style={{ flexDirection: "row" }}>
                  <Avatar
                    source={interlocutor ? interlocutor : currentChannel}
                    showIndicator={!!interlocutor}
                    style={{ marginRight: 10 }}
                  />
                  <Text variant="headline" color="neutral0">
                    {interlocutor ? interlocutor.name : currentChannel?.name}
                  </Text>
                </View>
              </TouchableHighlight>
            ),
        })}
      />
      <HomeStack.Screen name="NewChat" component={NewChatScreen} options={{ title: "New chat" }} />
      <HomeStack.Screen
        name="NewGroup"
        component={NewGroupScreen}
        options={{ title: "Group chat" }}
      />
      <HomeStack.Screen name="ThreadReply" component={ThreadReply} />
      <HomeStack.Screen
        name="ChatSettings"
        component={ChatSettings}
        options={{ title: "Chat settings" }}
      />
      <HomeStack.Screen name="PinnedMessage" component={PinnedMessage} />
    </HomeStack.Navigator>
  )
}

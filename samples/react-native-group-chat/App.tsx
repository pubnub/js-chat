import React, { useCallback, useContext, useEffect, useMemo, useState } from "react"
import {
  View,
  StyleSheet,
  ActivityIndicator,
  LogBox,
  TouchableHighlight,
  TouchableOpacity,
} from "react-native"
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet"
import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator, StackScreenProps } from "@react-navigation/stack"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { StatusBar } from "expo-status-bar"
import { Channel, Chat, Membership, User } from "@pubnub/chat"
import {
  useFonts,
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_700Bold,
} from "@expo-google-fonts/roboto"
import "react-native-get-random-values"

import { HomeStackScreen } from "./screens/tabs"
import {
  ChatScreen,
  ChatSettings,
  LoginScreen,
  NewChatScreen,
  NewGroupScreen,
  PinnedMessage,
  ThreadReply,
} from "./screens/ordinary"
import { ChatContext } from "./context"
import { RootStackParamList } from "./types"
import { defaultTheme, colorPalette as colors, Text } from "./ui-components"
import { Avatar } from "./components"

LogBox.ignoreLogs(["Require cycle:", "Sending"])

const MainStack = createStackNavigator<RootStackParamList>()

function MainRoutesNavigator({ route }: StackScreenProps<RootStackParamList, "mainRoutes">) {
  const { name } = route.params
  const { setChat, chat, currentChannel, currentChannelMembers } = useContext(ChatContext)

  const interlocutor =
    currentChannel?.type === "direct" &&
    currentChannelMembers.map((m) => m.user).filter((u) => u.id !== chat?.currentUser.id)[0]

  useEffect(() => {
    async function init() {
      const chat = await Chat.init({
        publishKey: process.env.EXPO_PUBLIC_PUBNUB_PUB_KEY || "demo",
        subscribeKey: process.env.EXPO_PUBLIC_PUBNUB_SUB_KEY || "demo",
        userId: name || "test-user",
        typingTimeout: 2000,
        storeUserActivityTimestamps: true,
        storeUserActivityInterval: 60000,
      })

      setChat(chat)
    }

    init()
  }, [name, setChat])

  if (!chat) {
    return (
      <View style={{ justifyContent: "center", flex: 1 }}>
        <ActivityIndicator size="large" color={colors.navy700} />
      </View>
    )
  }

  return (
    <MainStack.Navigator
      screenOptions={{
        headerStyle: {
          height: 64,
          backgroundColor: colors.navy900,
        },
        headerStatusBarHeight: 0, // there's some extra padding on top of the header without this
        headerTintColor: colors.neutral0,
      }}
    >
      <MainStack.Screen
        name="HomeStack"
        component={HomeStackScreen}
        initialParams={{ name }}
        options={{
          headerShown: false,
          headerTitle: "Home",
        }}
      />
      <MainStack.Screen
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
          headerRight: () => {
            return (
              <TouchableOpacity
                onPress={() => navigation.navigate("PinnedMessage")}
                style={{ paddingRight: 24 }}
              >
                <MaterialCommunityIcons name="pin-outline" color={colors.neutral0} size={26} />
              </TouchableOpacity>
            )
          },
        })}
      />
      <MainStack.Screen name="NewChat" component={NewChatScreen} options={{ title: "New chat" }} />
      <MainStack.Screen
        name="NewGroup"
        component={NewGroupScreen}
        options={{ title: "Group chat" }}
      />
      <MainStack.Screen name="ThreadReply" component={ThreadReply} />
      <MainStack.Screen
        name="ChatSettings"
        component={ChatSettings}
        options={{ title: "Chat settings" }}
      />
      <MainStack.Screen
        name="PinnedMessage"
        component={PinnedMessage}
        options={{ title: "Pinned message" }}
      />
    </MainStack.Navigator>
  )
}

function App() {
  const [chat, setChat] = useState<Chat | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [interlocutors, setInterlocutors] = useState<{ [channelId: string]: User }>({})
  const [loading, setLoading] = useState(false)
  const [currentChannel, setCurrentChannel] = useState<Channel | null>()
  const [currentChannelMembers, setCurrentChannelMembers] = useState<Membership[]>([])
  const [userMemberships, setUserMemberships] = useState<Membership[]>([])

  const setCurrentChannelWithMembers = useCallback(async (channel: Channel | null) => {
    if (!channel) {
      setCurrentChannelMembers([])
      setCurrentChannel(null)
      return
    }

    const { members } = await channel.getMembers()
    setCurrentChannelMembers(members)
    setCurrentChannel(channel)
  }, [])

  const getUser = useCallback(
    (userId: string) => {
      const existingUser = users.find((u) => u.id === userId)
      if (!existingUser) {
        chat?.getUser(userId).then((fetchedUser) => {
          if (fetchedUser) setUsers((users) => [...users, fetchedUser])
        })
        return null
      }
      return existingUser
    },
    [chat, users]
  )

  const getInterlocutor = useCallback(
    (channel: Channel) => {
      if (!chat) return null

      if (interlocutors[channel.id]) {
        return getUser(interlocutors[channel.id].id)
      }

      channel.getMembers().then(({ members }) => {
        const filteredMembers = members.filter((m) => m.user.id !== chat.currentUser.id)
        const user = filteredMembers.length ? filteredMembers[0].user : null

        if (!user) {
          return
        }

        setInterlocutors((currentInterlocutors) => ({
          ...currentInterlocutors,
          [channel.id]: user,
        }))
      })

      return null
    },
    [chat, getUser, interlocutors]
  )

  const [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
  })

  const contextValue = useMemo(
    () => ({
      loading,
      setLoading,
      chat,
      setChat,
      currentChannel,
      setCurrentChannel: setCurrentChannelWithMembers,
      currentChannelMembers,
      users,
      setUsers,
      getUser,
      getInterlocutor,
      memberships: userMemberships,
      setMemberships: setUserMemberships,
    }),
    [
      chat,
      currentChannel,
      currentChannelMembers,
      getInterlocutor,
      getUser,
      loading,
      userMemberships,
      users,
    ]
  )

  if (!fontsLoaded) {
    return null
  }

  return (
    <ChatContext.Provider value={contextValue}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BottomSheetModalProvider>
          <StatusBar style="inverted" backgroundColor={defaultTheme.colors.navy800} />
          <SafeAreaProvider>
            <SafeAreaView
              style={[styles.safeArea, { backgroundColor: defaultTheme.colors.navy800 }]}
              edges={["top", "left", "right"]}
            >
              <NavigationContainer>
                <MainStack.Navigator screenOptions={{ headerShown: false }}>
                  <MainStack.Screen name="login" component={LoginScreen} />
                  <MainStack.Screen name="mainRoutes" component={MainRoutesNavigator} />
                </MainStack.Navigator>
              </NavigationContainer>
            </SafeAreaView>
          </SafeAreaProvider>
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    </ChatContext.Provider>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    height: 66,
    justifyContent: "center",
    paddingHorizontal: 32,
  },
})

export default App

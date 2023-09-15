import { useContext, useEffect, useState } from "react"
import { View, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native"
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet"
import { NavigationContainer } from "@react-navigation/native"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { createStackNavigator, StackScreenProps } from "@react-navigation/stack"
import { PaperProvider } from "react-native-paper"
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons"
import { StatusBar } from "expo-status-bar"
import { Channel, Chat, Membership, User } from "@pubnub/chat"
import {
  useFonts,
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_700Bold,
} from "@expo-google-fonts/roboto"
import "react-native-get-random-values"

import { PeopleScreen, MentionsScreen, HomeStackScreen, ProfileScreen } from "./screens/tabs"
import { LoginScreen } from "./screens/ordinary"
import { ChatContext } from "./context"
import { RootStackParamList, BottomTabsParamList } from "./types"
import { defaultTheme, colorPalette as colors } from "./ui-components"

const Tab = createBottomTabNavigator<BottomTabsParamList>()
const MainStack = createStackNavigator<RootStackParamList>()

function TabNavigator({ route }: StackScreenProps<RootStackParamList, "tabs">) {
  const { name } = route.params
  const { setChat, chat } = useContext(ChatContext)

  useEffect(() => {
    async function init() {
      const chat = await Chat.init({
        publishKey: process.env.EXPO_PUBLIC_PUBNUB_PUB_KEY || "demo",
        subscribeKey: process.env.EXPO_PUBLIC_PUBNUB_SUB_KEY || "demo",
        userId: name || "test-user",
        typingTimeout: 2000,
        storeUserActivityTimestamps: true,
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
        name="HomeStack"
        component={HomeStackScreen}
        initialParams={{ name }}
        options={{
          tabBarLabel: "Home",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="home-outline" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="People"
        component={PeopleScreen}
        options={{
          tabBarLabel: "People",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="people-outline" size={24} color={color} />
          ),
        }}
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

function App() {
  const [chat, setChat] = useState<Chat | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [currentChannel, setCurrentChannel] = useState<Channel>()
  const [currentChannelMembers, setCurrentChannelMembers] = useState<Membership[]>([])
  const [userMemberships, setUserMemberships] = useState<Membership[]>([])

  async function setCurrentChannelWithMembers(channel: Channel) {
    const { members } = await channel.getMembers()
    setCurrentChannelMembers(members)
    setCurrentChannel(channel)
  }

  function getUser(userId: string) {
    const existingUser = users.find((u) => u.id === userId)
    if (!existingUser) {
      chat?.getUser(userId).then((fetchedUser) => {
        if (fetchedUser) setUsers((users) => [...users, fetchedUser])
      })
    }
    return existingUser
  }

  const [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
  })

  if (!fontsLoaded) {
    return null
  }

  return (
    <ChatContext.Provider
      value={{
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
        memberships: userMemberships,
        setMemberships: setUserMemberships,
      }}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BottomSheetModalProvider>
          <PaperProvider settings={{ rippleEffectEnabled: false }} theme={defaultTheme}>
            <StatusBar style="inverted" backgroundColor={defaultTheme.colors.navy800} />
            <SafeAreaProvider>
              <SafeAreaView
                style={[styles.safeArea, { backgroundColor: defaultTheme.colors.navy800 }]}
                edges={["top", "left", "right"]}
              >
                {/* TODO: for some reason KeyboardAvoidingView doesn't work on any page other than login */}
                <KeyboardAvoidingView
                  {...(Platform.OS === "ios" ? { behavior: "padding" } : {})}
                  style={{ flex: 1 }}
                >
                  <NavigationContainer>
                    <MainStack.Navigator screenOptions={{ headerShown: false }}>
                      <MainStack.Screen name="login" component={LoginScreen} />
                      <MainStack.Screen name="tabs" component={TabNavigator} />
                    </MainStack.Navigator>
                  </NavigationContainer>
                </KeyboardAvoidingView>
              </SafeAreaView>
            </SafeAreaProvider>
          </PaperProvider>
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

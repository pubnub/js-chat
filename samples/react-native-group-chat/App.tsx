import * as React from "react"
import { Chat, Membership } from "@pubnub/chat"
import { NavigationContainer } from "@react-navigation/native"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { PaperProvider } from "react-native-paper"
import { View, Text, Image, StyleSheet } from "react-native"
import { ChatContext } from "./context"
import { PeopleScreen } from "./screens/tabs/people"
import { MentionsScreen } from "./screens/tabs/mentions"
import { HomeStackScreen } from "./screens/tabs/home"
import { ProfileScreen } from "./screens/tabs/profile"
import { useContext, useEffect, useState } from "react"
import { createNativeStackNavigator, NativeStackScreenProps } from "@react-navigation/native-stack"
import { LoginScreen } from "./screens/ordinary/login-screen"
import { RootStackParamList } from "./types"
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context"
import { StatusBar } from "expo-status-bar"

const Tab = createBottomTabNavigator()
const MainStack = createNativeStackNavigator<RootStackParamList>()

const TabBarIcon = ({ source, tintColor }: { source: number; tintColor: string }) => (
  <Image source={source} style={{ width: 48, height: 24 }} tintColor={tintColor} />
)

const publishKey = "pub-c-0457cb83-0786-43df-bc70-723b16a6e816"
const subscribeKey = "sub-c-e654122d-85b5-49a6-a3dd-8ebc93c882de"

function TabNavigator({ route }: NativeStackScreenProps<RootStackParamList, "tabs">) {
  const { name } = route.params
  const { setChat, chat } = useContext(ChatContext)

  useEffect(() => {
    async function init() {
      const chat = await Chat.init({
        publishKey,
        subscribeKey,
        userId: name || "test-user",
        typingTimeout: 2000,
      })

      setChat(chat)
    }

    init()
  }, [name])

  if (!chat) {
    return (
      <View>
        <Text>Loading...</Text>
      </View>
    )
  }

  return (
    <Tab.Navigator
      screenOptions={{
        header: (props) => (
          <View style={styles.header}>
            <Text style={styles.title}>{props.route.name}</Text>
          </View>
        ),
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: "#171717",
        tabBarInactiveTintColor: "#64748B",
      }}
    >
      <Tab.Screen
        options={{
          tabBarLabel: "Home",
          headerShown: false,
          tabBarIcon: ({ color }) => {
            return <TabBarIcon tintColor={color} source={require("./assets/tabs/tab1.png")} />
          },
        }}
        name="HomeStack"
        component={HomeStackScreen}
        initialParams={{ name }}
      />
      <Tab.Screen
        name="People"
        component={PeopleScreen}
        options={{
          tabBarLabel: "People",
          tabBarIcon: ({ color }) => (
            <TabBarIcon tintColor={color} source={require("./assets/tabs/tab2.png")} />
          ),
        }}
      />
      <Tab.Screen
        name="Mentions"
        component={MentionsScreen}
        options={{
          tabBarLabel: "Mentions",
          tabBarIcon: ({ color }) => (
            <TabBarIcon tintColor={color} source={require("./assets/tabs/tab3.png")} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ color }) => (
            <TabBarIcon tintColor={color} source={require("./assets/tabs/tab4.png")} />
          ),
        }}
      />
    </Tab.Navigator>
  )
}

function App() {
  const [chat, setChat] = React.useState<Chat | null>(null)
  const [userMemberships, setUserMemberships] = useState<Membership[]>([])

  return (
    <ChatContext.Provider
      value={{
        chat,
        setChat,
        memberships: userMemberships,
        setMemberships: setUserMemberships,
      }}
    >
      <PaperProvider
        settings={{ rippleEffectEnabled: false }}
        theme={{ colors: { primary: "#171717" } }}
      >
        <SafeAreaProvider>
          <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
            <NavigationContainer>
              <MainStack.Navigator screenOptions={{ headerShown: false }}>
                <MainStack.Screen name="login" component={LoginScreen} />
                <MainStack.Screen name="tabs" component={TabNavigator} />
              </MainStack.Navigator>
            </NavigationContainer>
            <StatusBar style="inverted" backgroundColor="#1E293B" />
          </SafeAreaView>
        </SafeAreaProvider>
      </PaperProvider>
    </ChatContext.Provider>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#1E293B",
    flex: 1,
  },
  header: {
    backgroundColor: "#161C2D",
    height: 66,
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  tabBar: {
    backgroundColor: "#F8FAFC",
  },
})

export default App

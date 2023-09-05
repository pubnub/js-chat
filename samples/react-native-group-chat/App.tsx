import * as React from "react"
import { Chat, Membership } from "@pubnub/chat"
import { NavigationContainer } from "@react-navigation/native"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { PaperProvider } from "react-native-paper"
import { View, Text, Image } from "react-native"
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
import { useFonts } from "expo-font"
import { defaultTheme } from "./ui-components/defaultTheme"

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

  const [fontsLoaded] = useFonts({
    "Roboto-Black": require("./assets/fonts/roboto/Roboto-Black.ttf"),
    "Roboto-BlackItalic": require("./assets/fonts/roboto/Roboto-BlackItalic.ttf"),
    "Roboto-Bold": require("./assets/fonts/roboto/Roboto-Bold.ttf"),
    "Roboto-BoldItalic": require("./assets/fonts/roboto/Roboto-BoldItalic.ttf"),
    "Roboto-Italic": require("./assets/fonts/roboto/Roboto-Italic.ttf"),
    "Roboto-Light": require("./assets/fonts/roboto/Roboto-Light.ttf"),
    "Roboto-LightItalic": require("./assets/fonts/roboto/Roboto-LightItalic.ttf"),
    "Roboto-Medium": require("./assets/fonts/roboto/Roboto-Medium.ttf"),
    "Roboto-MediumItalic": require("./assets/fonts/roboto/Roboto-MediumItalic.ttf"),
    "Roboto-Regular": require("./assets/fonts/roboto/Roboto-Regular.ttf"),
    "Roboto-Thin": require("./assets/fonts/roboto/Roboto-Thin.ttf"),
    "Roboto-ThinItalic": require("./assets/fonts/roboto/Roboto-ThinItalic.ttf"),
  })

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
    <Tab.Navigator>
      <Tab.Screen
        options={{
          tabBarLabel: "Home",
          headerShown: false,
          tabBarIcon: ({ color }) => {
            return <TabBarIcon tintColor={color} source={require("./assets/tabs/tab1.png")} />
          },
          tabBarActiveTintColor: "#171717",
          tabBarInactiveTintColor: "#525252",
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
          tabBarActiveTintColor: "#171717",
          tabBarInactiveTintColor: "#525252",
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
          tabBarActiveTintColor: "#171717",
          tabBarInactiveTintColor: "#525252",
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: "Profile",
          tabBarActiveTintColor: "#171717",
          tabBarInactiveTintColor: "#525252",
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
      <PaperProvider settings={{ rippleEffectEnabled: false }} theme={defaultTheme}>
        <SafeAreaProvider>
          <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
            <NavigationContainer>
              <MainStack.Navigator screenOptions={{ headerShown: false }}>
                <MainStack.Screen name="login" component={LoginScreen} />
                <MainStack.Screen name="tabs" component={TabNavigator} />
              </MainStack.Navigator>
            </NavigationContainer>
            <StatusBar style="auto" />
          </SafeAreaView>
        </SafeAreaProvider>
      </PaperProvider>
    </ChatContext.Provider>
  )
}

export default App

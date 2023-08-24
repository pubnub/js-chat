import * as React from 'react';
import { Chat } from "@pubnub/chat"
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { PaperProvider } from 'react-native-paper';
import { View, Text } from "react-native";
import { ChatContext } from "./context";
import { PeopleScreen } from "./screens/tabs/people"
import { MentionsScreen } from "./screens/tabs/mentions"
import {HomeScreen, HomeStackScreen} from "./screens/tabs/home"
import { ProfileScreen } from "./screens/tabs/profile"
import {useContext, useEffect} from "react"
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {LoginScreen} from "./screens/ordinary/login-screen";

const Tab = createBottomTabNavigator()
const MainStack = createNativeStackNavigator();

const publishKey = "pub-c-0457cb83-0786-43df-bc70-723b16a6e816"
const subscribeKey = "sub-c-e654122d-85b5-49a6-a3dd-8ebc93c882de"

function TabNavigator({ route }) {
  const { name } = route.params;
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
        <Text>
          Loading...
        </Text>
      </View>
    )
  }


  return (
    <Tab.Navigator>
      <Tab.Screen
        options={{ headerShown: false }}
        name="HomeStack"
        component={HomeStackScreen}
        initialParams={{ name }}
      />
      <Tab.Screen name="Mentions" component={MentionsScreen} />
      <Tab.Screen name="People" component={PeopleScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

function App() {
  const [chat, setChat] = React.useState<Chat | null>(null)

  return (
    <ChatContext.Provider
      value={{
        chat,
        setChat,
      }}
    >
      <PaperProvider>
        <NavigationContainer>
          <MainStack.Navigator>
            <MainStack.Screen name="login" component={LoginScreen} />
            <MainStack.Screen name="tabs" component={TabNavigator} />
          </MainStack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </ChatContext.Provider>
  );
}

export default App;

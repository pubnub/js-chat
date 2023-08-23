import * as React from 'react';
import { View, Text } from 'react-native';
import { Chat } from "@pubnub/js-chat"
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PaperProvider } from 'react-native-paper';
import ChatScreen from "./Chat"
import { ChannelList } from "./ChannelList";
import { ChatContext } from "./context";;

const Stack = createNativeStackNavigator();

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
          <Stack.Navigator>
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="ChannelList" component={ChannelList} />
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </ChatContext.Provider>
  );
}

export default App;

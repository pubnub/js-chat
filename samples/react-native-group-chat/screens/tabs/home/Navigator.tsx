import React from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ChatScreen } from "../../ordinary/chat"
import { HomeScreen } from "./HomeScreen"

const HomeStack = createNativeStackNavigator();

export function HomeStackScreen({ route }) {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen name="Home" component={HomeScreen} initialParams={{ name: route.params.name }} />
      <HomeStack.Screen name="Chat" component={ChatScreen} />
    </HomeStack.Navigator>
  );
}

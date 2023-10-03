# Group chat app

This React Native Group Chat app shows how to use Chat SDK to set up a conversation between multiple chat users.

The app comes with a pre-defined UI to showcase what the final product might look like.

This app is written using:

* [PubNub Chat SDK](https://github.com/pubnub/js-chat)
* [TypeScript](https://www.typescriptlang.org/) (v^5.1.3)
* [Expo](https://expo.dev/) (v~49.0.8)
* [React](https://legacy.reactjs.org/versions/) (v18.2.0)
* [React Native](https://reactnative.dev/) (v0.72.4)

## Prerequisites

To run the React Native Group Chat app, make sure to have the following:

* [yarn](https://classic.yarnpkg.com/en/docs/install)(>=1.22.19)
* [Node.js](https://nodejs.org/en/download/)(>=18.10.0)
* [Xcode](https://developer.apple.com/xcode/)
* Code Editor (e.g. [Visual Studio Code](https://code.visualstudio.com/download))
* PubNub [Publish & Subscribe keys](https://www.pubnub.com/docs/basics/initialize-pubnub) that you can obtain from [Admin Portal](https://admin.pubnub.com/) after setting up an [account](https://www.pubnub.com/docs/setup/account-setup). You must enable **App Context** (with selected region, User Metadata Events, Channel Metadata Events, and Membership Metadata Events) and **Message Persistence** on your keyset to manage user and channel data in the app.

## Usage

To run the app on an iOS simulator, follow these steps:

1. Open the terminal, select the location, and download the Chat SDK.

   ```ssh showLineNumbers
   git clone git@github.com:pubnub/js-chat.git
   ```

1. Go to the downloaded repository folder.

   ```bash showLineNumbers
   cd js-chat-master
   ```

1. Install all the required dependencies.

   ```bash showLineNumbers
   yarn
   ```

1. Go to the `lib` folder that contains the TypeScript sources.

   ```bash showLineNumbers
   cd lib
   ```

1. Bundle the TypeScript library and compile it to a JavaScript script.

   ```bash showLineNumbers
   yarn build
   ```

1. Go to the `samples/react-native-group-chat` folder with the app's source code.

   ```bash showLineNumbers
   cd ../samples/react-native-group-chat
   ```

1. Add your publish and subscribe keys.

   Open the app in the code editor. Under the `samples/react-native-group-chat` folder, create a `.env` file and use it to specify values for your publish and subscribe keys from your app's keyset on the Admin Portal.

   ```ts showLineNumbers
   EXPO_PUBLIC_PUBNUB_PUB_KEY=
   EXPO_PUBLIC_PUBNUB_SUB_KEY=
   ```

1. Run the app in the terminal.

   ```bash showLineNumbers
   yarn ios
   ```

1. When the Xcode iOS simulator opens up successfully, you will see a login screen to the app. Log into the app and start playing with all available [Chat SDK features](#features).

## Features

The app showcases these PubNub features:

Channels:

* [Group channel creation](https://www.pubnub.com/docs/chat/chat-sdk/build/features/channels/create)
* [Channel references](https://www.pubnub.com/docs/chat/chat-sdk/build/features/channels/references)
* [Inviting](https://www.pubnub.com/docs/chat/chat-sdk/build/features/channels/invite) users to channels
* [Joining](https://www.pubnub.com/docs/chat/chat-sdk/build/features/channels/join) channels

Users:

* [User profile editing](https://www.pubnub.com/docs/chat/chat-sdk/build/features/users/updates)
* [User mentions](https://www.pubnub.com/docs/chat/chat-sdk/build/features/users/mentions)
* [Global (app) presence](https://www.pubnub.com/docs/chat/chat-sdk/build/features/users/presence#global-presence)

Messages:

* [Sending and receiving](https://www.pubnub.com/docs/chat/chat-sdk/build/features/messages/send-receive) messages
* [Threads](https://www.pubnub.com/docs/chat/chat-sdk/build/features/messages/threads)
* [Unread messages](https://www.pubnub.com/docs/chat/chat-sdk/build/features/messages/unread)
* [Reactions](https://www.pubnub.com/docs/chat/chat-sdk/build/features/messages/reactions)
* [Quotes](https://www.pubnub.com/docs/chat/chat-sdk/build/features/messages/quotes)
* [Plain links](https://www.pubnub.com/docs/chat/chat-sdk/build/features/messages/links)

Other:

* [Typing indicator](https://www.pubnub.com/docs/chat/chat-sdk/build/features/typing-indicator)

Still, these are only some of the features available in Chat SDK. For the complete overview, check [Chat SDK docs](https://www.pubnub.com/docs/chat/chat-sdk/overview).

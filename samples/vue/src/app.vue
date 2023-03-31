<template>
  <div>
    <p>PubNub initialized with: {{ pubnub.getUUID() }}</p>
  </div>
  <div class="flex" v-if="state.channel">
    <div class="column">
      <MessageInputSDK :pubnub="pubnub" :channel="state.channel.id" />
      <TypingIndicatorSDK :pubnub="pubnub" :channel="state.channel.id" />
      <MessageListSDK :pubnub="pubnub" :channel="state.channel.id" />
      <CreateChannelModalSDK :pubnub="pubnub" :toggleCreateChannelModal="toggleCreateChannelModalJSSDK" :createChannelModalOpen="state.createChannelModalJSSDKOpen" />
      <ChannelListSDK :pubnub="pubnub" />
      <button @click="toggleCreateChannelModalJSSDK">Open create channel modal</button>
    </div>
    <div class="column">
      <MessageInputChat :chat="chat" :channel="state.channel" />
      <TypingIndicatorChat :chat="chat" :channel="state.channel" />
      <MessageListChat :chat="chat" :channel="state.channel" />
      <CreateChannelModalChat :chat="chat" :toggleCreateChannelModal="toggleCreateChannelModalChatSDK" :createChannelModalOpen="state.createChannelModalChatsSDKOpen" />
      <ChannelListChat :chat="chat" />
      <button @click="toggleCreateChannelModalChatSDK">Open create channel modal</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import PubNub from "pubnub"
import { Channel, Chat } from "@pubnub/chat"
import MessageInputSDK from "./js-sdk/MessageInput.vue"
import MessageInputChat from "./chat-sdk/MessageInput.vue"
import TypingIndicatorSDK from "./js-sdk/TypingIndicator.vue"
import TypingIndicatorChat from "./chat-sdk/TypingIndicator.vue"
import MessageListSDK from "./js-sdk/MessageList.vue"
import MessageListChat from "./chat-sdk/MessageList.vue"
import CreateChannelModalChat from "./chat-sdk/CreateChannelModal.vue"
import ChannelListChat from "./chat-sdk/ChannelList.vue"
import ChannelListSDK from "./js-sdk/ChannelList.vue"
import CreateChannelModalSDK from "./js-sdk/CreateChannelModal.vue"
import { reactive } from "vue";

interface State {
  channel?: Channel
  createChannelModalJSSDKOpen: boolean;
  createChannelModalChatsSDKOpen: boolean;
}

const userId = "test-user"
const channelId = "test-channel"

const pubnub = new PubNub({
  publishKey: "demo",
  subscribeKey: "demo",
  userId,
})

const chat = Chat.init({
  publishKey: "demo",
  subscribeKey: "demo",
  userId,
  typingTimeout: 2000,
})

const state: State = reactive({
  channel: undefined,
  createChannelModalJSSDKOpen: false,
  createChannelModalChatsSDKOpen: false,
});

(async function() {
  state.channel = await chat.getChannel(channelId);
  const user = await chat.getUser(userId)
  chat.setChatUser(user)
})();

const toggleCreateChannelModalJSSDK = () => {
  state.createChannelModalJSSDKOpen = !state.createChannelModalJSSDKOpen;
}

const toggleCreateChannelModalChatSDK = () => {
  state.createChannelModalChatsSDKOpen = !state.createChannelModalChatsSDKOpen;
}

</script>

<style scoped>
.flex {
  display: flex;
}

.column {
  width: 50%;
}
</style>

<template>
  <div>
    <p>PubNub initialized with: {{ pubnub.getUUID() }}</p>
  </div>
  <div class="flex">
    <div class="column">
      <MessageInputSDK :pubnub="pubnub" :channel="channel.id" />
      <TypingIndicatorSDK :pubnub="pubnub" :channel="channel.id" />
      <MessageListSDK :pubnub="pubnub" :channel="channel.id" />
    </div>
    <div class="column">
      <MessageInputChat :chat="chat" :channel="channel" />
      <TypingIndicatorChat :chat="chat" :channel="channel" />
      <MessageListChat :chat="chat" :channel="channel" />
    </div>
  </div>
</template>

<script setup lang="ts">
import PubNub from "pubnub"
import { Chat } from "@pubnub/chat"
import MessageInputSDK from "./sdk/MessageInput.vue"
import MessageInputChat from "./chat/MessageInput.vue"
import TypingIndicatorSDK from "./sdk/TypingIndicator.vue"
import TypingIndicatorChat from "./chat/TypingIndicator.vue"
import MessageListSDK from "./sdk/MessageList.vue"
import MessageListChat from "./chat/MessageList.vue"

const userId = "test-user"
const channelId = "test-channel"

const pubnub = new PubNub({
  subscribeKey: "demo",
  publishKey: "demo",
  userId,
})

const chat = Chat.init({
  subscribeKey: "demo",
  publishKey: "demo",
  userId,
  typingTimeout: 2000,
})

const channel = chat.getChannel(channelId)
const user = chat.getUser(userId)
chat.setChatUser(user)
</script>

<style scoped>
.flex {
  display: flex;
}

.column {
  width: 50%;
}
</style>

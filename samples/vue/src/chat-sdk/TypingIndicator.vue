<script setup lang="ts">
import { Chat, Channel } from "@pubnub/chat"
import { reactive } from "vue"

const props = defineProps<{
  chat: Chat
  channel: Channel
}>()

interface State {
  typingReceived: boolean
}

const state: State = reactive({
  typingReceived: false,
})

props.channel.getTyping((value) => (state.typingReceived = value))
</script>

<template>
  <div class="typing-indicator">
    <h1>Chat Typing Indicator</h1>
    <p v-if="state.typingReceived">{{ props.chat.sdk.getUUID() }} is typing...</p>
  </div>
</template>

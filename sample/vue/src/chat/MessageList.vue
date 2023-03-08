<script setup lang="ts">
import { Chat, Channel, MessageContent } from "@pubnub/chat"
import { reactive } from "vue"

const props = defineProps<{
  chat: Chat
  channel: Channel
}>()

interface State {
  messages: MessageContent[]
}

const state: State = reactive({
  messages: [],
})

props.channel.connect((message) => state.messages.push(message.content))
</script>

<template>
  <div class="message-list">
    <h1>Chat Message List</h1>
    <p v-for="message in state.messages">{{ message.text }}</p>
  </div>
</template>

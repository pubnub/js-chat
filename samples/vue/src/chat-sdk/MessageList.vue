<script setup lang="ts">
import { Chat, Channel, Message } from "@pubnub/chat"
import { reactive } from "vue"

const props = defineProps<{
  chat: Chat
  channel: Channel
}>()

interface State {
  messages: Message[]
  isPaginationEnd: boolean
}

const state: State = reactive({
  messages: [],
  isPaginationEnd: false,
})

async function loadMoreHistoricalMessages() {
  const historicalMessagesObject = await props.channel.getHistory({ startTimetoken: state.messages?.[0]?.timetoken })

  state.isPaginationEnd = !historicalMessagesObject.isMore

  state.messages = [...historicalMessagesObject.messages, ...state.messages]
}

async function init() {
  await loadMoreHistoricalMessages()
  props.channel.connect((message) => state.messages.push(message))
}

init()
</script>

<template>
  <div class="message-list">
    <h1>Chat Message List</h1>
    <p v-for="message in state.messages">{{ message.content.text }}</p>
    <button :disabled="state.isPaginationEnd" @click="loadMoreHistoricalMessages()">Load more historical messages</button>
  </div>
</template>

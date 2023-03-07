<script setup lang="ts">
import { Chat, Channel } from "@pubnub/chat"
import { reactive } from "vue"

const props = defineProps<{
  chat: Chat
  channel: Channel
}>()

interface State {
  text: string
  typingSent: boolean
}

const state: State = reactive({
  text: "",
  typingSent: false,
})

const sendTyping = async (value: boolean) => {
  await props.channel.sendTyping(value)
  state.typingSent = value
}

const handleInput = () => {
  if (state.text && !state.typingSent) sendTyping(true)
  if (!state.text && state.typingSent) sendTyping(false)
}

const handleSend = async () => {
  await props.channel.sendText(state.text)
  await sendTyping(false)
  state.text = ""
}
</script>

<template>
  <div class="message-input">
    <h1>Chat Message Input</h1>
    <input type="text" v-model="state.text" @input="handleInput" />
    <button @click="handleSend">Send</button>
  </div>
</template>

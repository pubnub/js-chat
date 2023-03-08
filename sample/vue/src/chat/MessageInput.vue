<script setup lang="ts">
import { Chat, Channel } from "@pubnub/chat"
import { reactive } from "vue"

const props = defineProps<{
  chat: Chat
  channel: Channel
}>()

interface State {
  text: string
}

const state: State = reactive({
  text: "",
})

const sendTyping = async (value: boolean) => {
  await props.channel.sendTyping(value, { timeout: 5000, data: { name: "Uknown User" } })
}

const handleInput = () => {
  sendTyping(!!state.text)
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

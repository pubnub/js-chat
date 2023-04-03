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

const handleInput = () => {
  state.text ? props.channel.startTyping() : props.channel.stopTyping()
}

const handleSend = async () => {
  props.channel.stopTyping()
  props.channel.sendText(state.text)
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

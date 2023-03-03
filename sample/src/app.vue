<template>
  <div>
    <p>PubNub initialized with: {{ pubnub.getUUID() }}</p>
  </div>
  <div class="message-input">
    <h1>Message Input</h1>
    <input type="text" v-model="state.text" @input="handleInput" /><button @click="handleSend">
      Send
    </button>
  </div>
  <div class="message-input">
    <h1>Typing Indicator</h1>
    <p v-if="state.typingReceived">{{ pubnub.getUUID() }} is typing...</p>
  </div>
  <div class="message-list">
    <h1>Message List</h1>
    <p v-for="message in state.messages">{{ message.text }}</p>
  </div>
</template>

<script setup lang="ts">
import PubNub from "pubnub"
import { Chat } from "@pubnub/chat"
import { reactive } from "vue"

console.log("Chat SDK: ", Chat)

interface Message {
  text: string
  type: string
}

interface State {
  channel: string
  text: string
  messages: Message[]
  typingReceived: boolean
  typingSent: boolean
}

const state: State = reactive({
  channel: "test-channel",
  text: "",
  messages: [],
  typingReceived: false,
  typingSent: false,
})

const pubnub = new PubNub({
  subscribeKey: "demo",
  publishKey: "demo",
  userId: "test-user",
})

pubnub.addListener({
  message: (event) => {
    const { message } = event
    if (message.type === "text") state.messages.push(message)
  },
  signal: (event) => {
    const { message } = event
    if (message.type === "typing") state.typingReceived = message.value
  },
})

pubnub.subscribe({
  channels: [state.channel],
})

const sendTyping = async (value: boolean) => {
  await pubnub.signal({ channel: state.channel, message: { type: "typing", value } })
  state.typingSent = value
}

const handleInput = () => {
  if (state.text && !state.typingSent) {
    setTimeout(() => {
      console.log("stopped typing")
    }, 3000)
    sendTyping(true)
  }
  if (!state.text && state.typingSent) sendTyping(false)
}

const handleSend = async () => {
  await pubnub.publish({ channel: state.channel, message: { text: state.text, type: "text" } })
  await sendTyping(false)
  state.text = ""
}
</script>

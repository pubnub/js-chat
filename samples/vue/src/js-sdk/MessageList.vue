<script setup lang="ts">
import PubNub from "pubnub"
import { reactive } from "vue"

interface Message {
  text: string
  type: string
}

const props = defineProps<{
  pubnub: PubNub
  channel: string
}>()

interface State {
  messages: Message[]
}

const state: State = reactive({
  messages: [],
})

props.pubnub.addListener({
  message: (event) => {
    const { message } = event
    if (message.type === "text") state.messages.push(message)
  },
})

props.pubnub.subscribe({
  channels: [props.channel],
})
</script>

<template>
  <div class="message-list">
    <h1>SDK Message List</h1>
    <p v-for="message in state.messages">{{ message.text }}</p>
  </div>
</template>

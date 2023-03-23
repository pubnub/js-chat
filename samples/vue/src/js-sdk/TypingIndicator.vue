<script setup lang="ts">
import PubNub from "pubnub"
import { reactive } from "vue"

const props = defineProps<{
  pubnub: PubNub
  channel: string
}>()

interface State {
  typingReceived: boolean
}

const state: State = reactive({
  typingReceived: false,
})

props.pubnub.addListener({
  signal: (event) => {
    const { message } = event
    if (message.type === "typing") state.typingReceived = message.value
  },
})

props.pubnub.subscribe({
  channels: [props.channel],
})
</script>

<template>
  <div class="typing-indicator">
    <h1>SDK Typing Indicator</h1>
    <p v-if="state.typingReceived">{{ pubnub.getUUID() }} is typing...</p>
  </div>
</template>

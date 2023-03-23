<script setup lang="ts">
import PubNub from "pubnub"
import { reactive, computed } from "vue"

const props = defineProps<{
  pubnub: PubNub
  channel: string
}>()

interface State {
  typingReceived: Map<string, boolean>
}

const state: State = reactive({
  typingReceived: new Map(),
})

const typingString = computed(() => {
  const ids: string[] = []
  state.typingReceived.forEach((val, key) => (val ? ids.push(key) : null))
  if (ids.length > 1) return "Multiple users are typing..."
  if (ids.length === 1) return `${ids[0]} is typing...`
  return ""
})

props.pubnub.addListener({
  signal: (event) => {
    const { publisher, message } = event
    if (message.type === "typing") state.typingReceived.set(publisher, message.value)
  },
})

props.pubnub.subscribe({
  channels: [props.channel],
})
</script>

<template>
  <div class="typing-indicator">
    <h1>SDK Typing Indicator</h1>
    <p>{{ typingString }}</p>
  </div>
</template>

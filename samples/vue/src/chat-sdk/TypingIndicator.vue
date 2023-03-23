<script setup lang="ts">
import { Chat, Channel, TypingData } from "@pubnub/chat"
import { ref } from "vue"

const props = defineProps<{
  chat: Chat
  channel: Channel
}>()

let typingData = ref<TypingData[]>([])

props.channel.getTyping((data) => {
  console.log(data)
  typingData.value = data
})
</script>

<template>
  <div class="typing-indicator">
    <h1>Chat Typing Indicator</h1>
    <p v-for="typing in typingData">{{ typing.name }} is typing...</p>
  </div>
</template>

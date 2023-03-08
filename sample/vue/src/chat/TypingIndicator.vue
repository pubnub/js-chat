<script setup lang="ts">
import { Chat, Channel, TypingData } from "@pubnub/chat"
import { ref } from "vue"

const props = defineProps<{
  chat: Chat
  channel: Channel
}>()

type NameCustom = { name: string }

let typingData = ref<TypingData<NameCustom>[]>([])

props.channel.getTyping<NameCustom>((data) => (typingData.value = data))
</script>

<template>
  <div class="typing-indicator">
    <h1>Chat Typing Indicator</h1>
    <p v-for="typing in typingData">{{ typing.data?.name }} is typing...</p>
  </div>
</template>

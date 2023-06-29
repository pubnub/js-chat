<script setup lang="ts">
import { reactive, toRaw } from "vue"
import { chatAtom } from "../store"
import { useStore } from "@nanostores/vue"
import { Message, INTERNAL_ADMIN_CHANNEL, MessageType } from "@pubnub/chat"

const $chat = toRaw(useStore(chatAtom))
const state: {
  messages: Message[]
} = reactive({
  messages: [],
})

chatAtom.subscribe((value) => {
  if (value) init()
})

async function init() {
  const channel = await $chat.value.getChannel(INTERNAL_ADMIN_CHANNEL)
  channel?.connect((msg) => {
    state.messages.push(msg)
  })
}
</script>

<template>
  <ul>
    <li v-for="msg in state.messages" class="mb-4">
      <div v-if="msg.content.type === MessageType.REPORT">
        <b>Reported message</b>
        <p>Reason: {{ msg.content.reason }}</p>
        <p>Original text: {{ msg.text }}</p>
        <p>Author: {{ msg.content.reportedUserId }}</p>
        <p>Channel: {{ msg.content.reportedMessageChannelId }}</p>
        <p>Reporting user: {{ msg.userId }}</p>
      </div>
    </li>
  </ul>
</template>

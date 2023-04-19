<script setup lang="ts">
import PubNub, { FetchMessagesResponse } from "pubnub"
import { reactive } from "vue"

interface Message {
  text: string
  type: string
  timetoken: string
}

const props = defineProps<{
  pubnub: PubNub
  channel: string
}>()

interface State {
  messages: FetchMessagesResponse["channels"]["channel"]
  isPaginationEnd: boolean
}

const state: State = reactive({
  messages: [],
  isPaginationEnd: false,
})

async function getHistory() {
  try {
    const options = {
      channels: [props.channel],
      count: 25,
      start: state.messages?.[0]?.timetoken || undefined,
      includeMessageActions: true,
      includeMeta: true,
    };

    const response = await props.pubnub.fetchMessages(options);

    state.isPaginationEnd = response.channels[props.channel].length !== 25
    state.messages = [...response.channels[props.channel], ...state.messages]
  } catch(error) {
    throw error
  }
}

async function init() {
  await getHistory()

  props.pubnub.addListener({
    message: (event) => {
      const { message } = event
      if (message.type === "text") state.messages.push(message)
    },
  })

  props.pubnub.subscribe({
    channels: [props.channel],
  })
}

init()

</script>

<template>
  <div class="message-list">
    <h1>SDK Message List</h1>
    <p v-for="message in state.messages">{{ message.message.text }}</p>
    <button :disabled="state.isPaginationEnd" @click="getHistory()">Load more historical messages</button>
  </div>
</template>

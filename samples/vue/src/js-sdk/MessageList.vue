<script setup lang="ts">
import PubNub, { FetchMessagesResponse } from "pubnub"
import { reactive } from "vue"

interface Message {
  text: string
  type: string
  timetoken: string
  publisher: string
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

async function forwardMessage(message: Message) {
  await props.pubnub.publish({
    channel: "forward-channel",
    message: { text: message.message?.text || message.text, type: "text" },
    meta: {
      originalPublisher: message.publisher,
    }
  })

  console.log("Message forwarded to: forward-channel")
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
    <div>
      <div v-for="message in state.messages">
        <div class="message-row">
          <p>
            {{ message.message?.text || message.content?.text }}
          </p>
          <div class="message-row__forward-icon__container" @click="forwardMessage(message)">
            <img src="../assets/forwardIcon.png" class="message-row__forward-icon" />
          </div>
        </div>
      </div>
    </div>
    <button :disabled="state.isPaginationEnd" @click="getHistory()">Load more historical messages</button>
  </div>
</template>

<style scoped>
  .message-row {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    max-width: 250px;
  }

  .message-row__forward-icon {
    width: 20px;
    height: 20px;
  }

  .message-row__forward-icon__container {
    cursor: pointer;
  }
</style>

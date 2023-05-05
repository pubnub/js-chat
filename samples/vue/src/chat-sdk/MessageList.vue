<script setup lang="ts">
import { Chat, Channel, Message } from "@pubnub/chat"
import { reactive } from "vue"

const props = defineProps<{
  chat: Chat
  channel: Channel
}>()

interface State {
  messages: Message[]
  isPaginationEnd: boolean
}

const state: State = reactive({
  messages: [],
  isPaginationEnd: false,
})

async function loadMoreHistoricalMessages() {
  const historicalMessagesObject = await props.channel.getHistory({ startTimetoken: state.messages?.[0]?.timetoken })

  state.isPaginationEnd = !historicalMessagesObject.isMore

  state.messages = [...historicalMessagesObject.messages, ...state.messages]
}

async function forwardMessage(message: Message) {
  const forwardChannel =
      (await props.chat.getChannel("forward-channel")) ||
      (await props.chat.createChannel("forward-channel", { name: "forward channel" }))

  await forwardChannel.forwardMessage(message)

  console.log("Message forwarded to:", forwardChannel.id)
}

async function init() {
  await loadMoreHistoricalMessages()
  props.channel.connect((message) => state.messages.push(message))
}

init()
</script>

<template>
  <div class="message-list">
    <h1>Chat Message List</h1>
    <div>
      <div v-for="message in state.messages">
        <div class="message-row">
          <p>
            {{ message.content?.text || message.message?.text }}
          </p>
          <div class="message-row__forward-icon__container" @click="forwardMessage(message)">
            <img src="../assets/forwardIcon.png" class="message-row__forward-icon" />
          </div>
        </div>
      </div>
    </div>
    <button :disabled="state.isPaginationEnd" @click="loadMoreHistoricalMessages()">Load more historical messages</button>
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

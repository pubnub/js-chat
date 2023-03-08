<script setup lang="ts">
import PubNub from "pubnub"
import { reactive } from "vue"

const props = defineProps<{
  pubnub: PubNub
  channel: string
}>()

interface State {
  text: string
  typingSent: boolean
}

const state: State = reactive({
  text: "",
  typingSent: false,
})

const sendTyping = async (value: boolean) => {
  await props.pubnub.signal({ channel: props.channel, message: { type: "typing", value } })
  state.typingSent = value
}

const handleInput = () => {
  if (state.text && !state.typingSent) sendTyping(true)
  if (!state.text && state.typingSent) sendTyping(false)
}

const handleSend = async () => {
  await props.pubnub.publish({
    channel: props.channel,
    message: { text: state.text, type: "text" },
  })
  await sendTyping(false)
  state.text = ""
}
</script>

<template>
  <div class="message-input">
    <h1>SDK Message Input</h1>
    <input type="text" v-model="state.text" @input="handleInput" />
    <button @click="handleSend">Send</button>
  </div>
</template>

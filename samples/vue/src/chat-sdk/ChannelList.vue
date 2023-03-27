<script setup lang="ts">
import { ChannelEntity, Chat } from "@pubnub/chat"
import { reactive } from "vue"

const props = defineProps<{
  chat: Chat
}>()

interface State {
  channels: ChannelEntity[]
}

const state: State = reactive({
  channels: [],
})

async function init() {
  const channelsResponse = await props.chat.getChannels();
  state.channels = channelsResponse.data;
}

init();

</script>

<template>
  <div>
    <h1>
      channel list
    </h1>
    <ul>
      <li v-for="channel in state.channels">{{ channel.name }}</li>
    </ul>
  </div>
</template>

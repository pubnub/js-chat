<script setup lang="ts">
import { Channel, Chat } from "@pubnub/chat"
import { reactive } from "vue"

const props = defineProps<{
  chat: Chat
}>()

interface State {
  channels: Channel[]
  channelClickedNumber: number;
  nameInput: string;
}

const state: State = reactive({
  channels: [],
  channelClickedNumber: -1,
  nameInput: "",
})

async function loadChannels() {
  state.channels = await props.chat.getChannels();
}

function clickOnChannel(index: number) {
  state.channelClickedNumber = index;
}

async function editChannel() {
  await state.channels[state.channelClickedNumber].update({ name: state.nameInput });
  state.channelClickedNumber = -1;
  state.nameInput = "";
  loadChannels();
}

async function init() {
  loadChannels();
}

init();

</script>

<template>
  <div>
    <h1>
      channel list
    </h1>
    <ul>
      <li v-for="(channel, index) in state.channels">
        <div v-if="index === state.channelClickedNumber">
          <input type="text" v-model="state.nameInput" />
          <button @click="editChannel()">Edit</button>
        </div>
        <div v-if="index !== state.channelClickedNumber">
          <span @click="clickOnChannel(index)">{{ channel.name || "No channel name provided" }}</span>
        </div>
      </li>
    </ul>
  </div>
</template>

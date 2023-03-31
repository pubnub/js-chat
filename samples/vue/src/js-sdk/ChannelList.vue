<script setup lang="ts">
import { reactive } from "vue"
import PubNub, { ChannelMetadataObject, ObjectCustom } from "pubnub";

const props = defineProps<{
  pubnub: PubNub
}>()

interface State {
  channels: ChannelMetadataObject<ObjectCustom>[];
  channelClickedNumber: number;
  nameInput: string;
}

const state: State = reactive({
  channels: [],
  channelClickedNumber: -1,
  nameInput: "",
})

async function loadChannels() {
  const channelsResponse = await props.pubnub.objects.getAllChannelMetadata();
  state.channels = channelsResponse.data.slice(0, 5);
}

function clickOnChannel(index: number) {
  state.channelClickedNumber = index;
}

async function editChannel() {
  await props.pubnub.objects.setChannelMetadata({
    channel: state.channels[state.channelClickedNumber].id,
    data: { name: state.nameInput },
  })

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

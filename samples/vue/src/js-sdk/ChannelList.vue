<script setup lang="ts">
import { reactive } from "vue"
import PubNub, { ChannelMetadataObject, ObjectCustom } from "pubnub";

const props = defineProps<{
  pubnub: PubNub
}>()

interface State {
  channels: ChannelMetadataObject<ObjectCustom>[]
}

const state: State = reactive({
  channels: [],
})

async function init() {
  const channelsResponse = await props.pubnub.objects.getAllChannelMetadata();
  state.channels = channelsResponse.data.slice(0, 1);
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

<script setup lang="ts">
import { Chat } from "@pubnub/chat"
import { reactive } from "vue"

const props = defineProps<{
  chat: Chat
  toggleCreateChannelModal: Function
  createChannelModalOpen: boolean
}>()

interface State {
  channelNameInput: string
}

const state: State = reactive({
  channelNameInput: "",
})

async function submitCreateChannelForm(e) {
  e.preventDefault();
  if (!state.channelNameInput) {
    return;
  }

  await props.chat.createChannel(state.channelNameInput.replaceAll(" ", "."), { name: state.channelNameInput });
  props.toggleCreateChannelModal();
}

</script>

<template>
  <div class="createChannelModalWrapper" v-if="createChannelModalOpen">
    <div class="createChannelModalWrapper__content">
      <h2>Create channel modal</h2>
      <form>
        <fieldset>
          <label for="channelName">Channel name</label>
          <input v-model="state.channelNameInput" type="text" id="channelName" name="channelName" />
          <input type="submit" value="Submit" @click="submitCreateChannelForm">
        </fieldset>
      </form>
      <div @click="toggleCreateChannelModal">Close</div>
    </div>
  </div>

</template>

<style scoped>
.createChannelModalWrapper {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
}

.createChannelModalWrapper__content {
  display: flex;
  flex-direction: column;
  background-color: white;
}

</style>

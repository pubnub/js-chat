<script setup>
import { reactive } from "vue"
import { userIdAtom, chatAtom } from "../store"
import { useStore } from "@nanostores/vue"

const $chat = useStore(chatAtom)
const $userId = useStore(userIdAtom)

let state = reactive({
  messages: [],
})

async function getHistory() {
  const channel = await $chat.value.getChannel("test-channel")
  const { messages } = await channel?.getHistory()
  state.messages = messages
}

async function handleUpdate(message) {
  // await message.editText(message.getText() + " up")
  await message.toggleReaction("👍")
  console.log("edited message: ", message)
}

chatAtom.subscribe((value) => {
  if (value) getHistory()
})
</script>

<template>
  <div class="grid lg:grid-cols-2 gap-8 mt-6">
    <section>
      <h3>Channel history</h3>
      {{ state.text }}
      <li v-for="message in state.messages">
        {{ message.userId }}: {{ message.getText() }} {{ message.hasUserReaction("👍") }} |
        {{ message.actions?.reactions?.["👍"].find((a) => a.uuid === $userId) }}
        <button @click="() => handleUpdate(message)">Edit</button>
        <!-- {{ message.content.text }} -->
      </li>
    </section>
  </div>
</template>

<script setup lang="ts">
import { reactive } from "vue"
import { userIdAtom, chatAtom } from "../store"
import { useStore } from "@nanostores/vue"
import type { User } from "@pubnub/chat"

const $userId = useStore(userIdAtom)
const $chat = useStore(chatAtom)

interface State {
  error: string
  user?: User
  allUsers: User[]
  totalCount: number
  page: string
}

const state: State = reactive({
  error: "",
  user: undefined,
  allUsers: [],
  totalCount: 0,
  page: "",
})

const createUserForm = reactive({
  id: $userId.value,
  name: undefined,
  profileUrl: undefined,
  email: undefined,
})

const getUserForm = reactive({
  id: $userId.value,
})

function extractErrorMessage(e: any) {
  if (typeof e === "string") return e
  let ret = ""
  const status = e?.status?.errorData?.status
  const message =
    e?.status?.errorData?.message || e?.status?.errorData?.error?.message || "Unknown error"
  if (status) ret += `${status}: `
  ret += message
  return ret
}

async function handleGetAll() {
  try {
    state.error = ""
    const users = await $chat.value.getAllUsers()
    console.log("users object: ", users)
  } catch (e: any) {
    state.error = extractErrorMessage(e)
    console.error(e)
  }
}

async function handleGet() {
  try {
    state.error = ""
    const user = await $chat.value.getUser(getUserForm.id)
    console.log("Chat SDK fetched a user: ", user)
    state.user = user
  } catch (e: any) {
    state.error = extractErrorMessage(e)
    console.error(e)
  }
}

async function handleSet() {
  try {
    state.error = ""
    const { id, ...data } = createUserForm
    const user = await $chat.value.createUser(id, { ...data })
    createUserForm.name = createUserForm.email = createUserForm.profileUrl = undefined
    console.log("Chat SDK created a user: ", user)
  } catch (e: any) {
    state.error = extractErrorMessage(e)
    console.error(e)
  }
}

async function handleHardDelete() {
  try {
    if (!state.user) return
    await state.user.delete(false)
    console.log("Chat SDK hard deleted a user")
    state.user = undefined
  } catch (e: any) {
    state.error = extractErrorMessage(e)
    console.error(e)
  }
}

async function handleSoftDelete() {
  try {
    if (!state.user) return
    const user = await state.user.delete(true)
    console.log("Chat SDK soft deleted a user: ", user)
    state.user = undefined
  } catch (e: any) {
    state.error = extractErrorMessage(e)
    console.error(e)
  }
}
</script>

<template>
  <p class="error my-4" v-if="state.error">{{ state.error }}</p>

  <div>
    <h3>Get all users</h3>
    <button class="mb-4" @click="handleGetAll">Get all users</button>
    <p><b>Total count: </b>{{ state.totalCount }}</p>
    <p><b>Existing IDs: </b>{{ state.allUsers }}</p>
  </div>
  <div class="grid grid-cols-2 gap-4 mt-6">
    <section>
      <h3>Create user</h3>
      <form @submit.prevent="handleSet">
        <label for="id">User ID</label>
        <input v-model="createUserForm.id" type="text" name="id" />
        <label for="name">Name</label>
        <input v-model="createUserForm.name" type="text" name="name" />
        <label for="profileUrl">Profile URL</label>
        <input v-model="createUserForm.profileUrl" type="text" name="profileUrl" />
        <button type="submit" class="float-right mt-3">Create user</button>
      </form>
    </section>

    <section>
      <h3>Get user</h3>
      <form @submit.prevent="handleGet">
        <label for="login">User ID</label>
        <input v-model="getUserForm.id" type="text" name="login" />
        <button type="submit" class="float-right mt-3">Get user</button>
      </form>
      <div class="mt-4">
        <p><b>Name:</b> {{ state.user?.name }}</p>
        <p><b>Profile URL:</b> {{ state.user?.profileUrl }}</p>
        <p><b>Status:</b> {{ state.user?.status }}</p>
      </div>

      <h3 class="mt-6">Delete user</h3>
      <div v-if="state.user">
        <button @click="handleHardDelete" class="mr-2">Hard delete user</button>
        <button @click="handleSoftDelete">Soft delete user</button>
      </div>
      <p v-else>Fetch a user to delete it</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { reactive } from "vue"
import { userIdAtom, chatAtom } from "../store"
import { useStore } from "@nanostores/vue"
import type { User } from "@pubnub/chat"
import { extractErrorMessage } from "./helpers"

const $userId = useStore(userIdAtom)
const $chat = useStore(chatAtom)

interface State {
  error: string
  user?: User
  users: User[]
  total: number
  page: { next?: string; prev?: string }
  presence?: string[]
}

const state: State = reactive({
  error: "",
  user: undefined,
  users: [],
  total: 0,
  page: { next: undefined, prev: undefined },
  presence: [],
})

const getUserForm = reactive({
  id: $userId.value,
})

interface UpdateUserForm {
  id?: string
  name?: string
  profileUrl?: string
  email?: string
  status?: string
}

const updateUserForm: UpdateUserForm = reactive({
  id: undefined,
  name: undefined,
  profileUrl: undefined,
  email: undefined,
  status: undefined,
})

interface Forms {
  getUser: {
    id?: string
  }
  presence: {
    checkChannel: string
  }
}

const forms: Forms = reactive({
  getUser: {
    id: $userId.value,
  },
  presence: {
    subscriptions: "",
    checkChannel: "",
  },
})

function resetUserForm() {
  updateUserForm.name =
    updateUserForm.email =
    updateUserForm.profileUrl =
    updateUserForm.status =
      undefined
}

async function handleGetAll() {
  try {
    state.error = ""
    do {
      const { users, page, total } = await $chat.value.getUsers({ limit: 2, page: state.page })
      state.users.push(...users)
      state.page = page
      state.total = total || 0
    } while (state.users.length < state.total)
  } catch (e: any) {
    state.error = extractErrorMessage(e)
    console.error(e)
  }
}

async function handleGet() {
  try {
    state.error = ""
    if (!getUserForm.id) return
    const user = await $chat.value.getUser(getUserForm.id)
    console.log("Chat SDK fetched a user: ", user)
    if (user) {
      state.user = user
      updateUserForm.id = user.id
      updateUserForm.name = user.name
      updateUserForm.profileUrl = user.profileUrl
      updateUserForm.status = user.status
    } else state.error = "User not found"
  } catch (e: any) {
    state.error = extractErrorMessage(e)
    console.error(e)
  }
}

async function handleSet() {
  try {
    state.error = ""
    const { id, ...data } = updateUserForm
    if (!id) return
    console.log(id, data)
    const user = await $chat.value.updateUser(id, { ...data })
    resetUserForm()
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
    resetUserForm()
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
    resetUserForm()
    console.log("Chat SDK soft deleted a user: ", user)
    state.user = undefined
  } catch (e: any) {
    state.error = extractErrorMessage(e)
    console.error(e)
  }
}

async function handleGetPresence() {
  try {
    state.presence = await state.user?.wherePresent()
  } catch (e: any) {
    state.error = extractErrorMessage(e)
    console.error(e)
  }
}

async function handleCheckPresence() {
  try {
    const isPresent = await state.user?.isPresentOn(forms.presence.checkChannel)
    alert(`User is ${isPresent ? "" : "NOT"} present on the ${forms.presence.checkChannel} channel`)
  } catch (e: any) {
    state.error = extractErrorMessage(e)
    console.error(e)
  }
}

chatAtom.subscribe((value) => {
  if (value) handleGet()
})
</script>

<template>
  <p class="error my-4" v-if="state.error">{{ state.error }}</p>
  <div>
    <h3>Get all users</h3>
    <button class="mb-4" @click="handleGetAll">Get all users</button>
    <div v-if="state.users.length">
      <p><b>Total count: </b>{{ state.total }}</p>
      <p><b>Existing IDs: </b>{{ state.users.map((u) => u.id).join(", ") }}</p>
    </div>
  </div>
  <div class="grid lg:grid-cols-2 gap-8 mt-6">
    <section>
      <h3>Get user</h3>
      <form @submit.prevent="handleGet">
        <label for="login">User ID</label>
        <input v-model="getUserForm.id" type="text" name="login" />
        <button type="submit" class="float-right mt-3">Get user</button>
      </form>
    </section>

    <section>
      <h3>Update user</h3>
      <form>
        <label for="id">User ID</label>
        <input v-model="updateUserForm.id" type="text" name="id" />
        <label for="name">Name</label>
        <input v-model="updateUserForm.name" type="text" name="name" />
        <label for="profileUrl">Avatar URL</label>
        <input v-model="updateUserForm.profileUrl" type="text" name="profileUrl" />
        <label for="status">Status</label>
        <input v-model="updateUserForm.status" type="text" name="status" />
        <nav class="float-right mt-3">
          <button type="button" @click="handleHardDelete" class="mr-2">Hard delete user</button>
          <button type="button" @click="handleSoftDelete" class="mr-2">Soft delete user</button>
          <button type="button" @click="handleSet">Update user</button>
        </nav>
      </form>
    </section>
  </div>

  <div class="grid lg:grid-cols-2 gap-8 mt-6">
    <section>
      <h3>User presence</h3>
      <button @click="handleGetPresence" class="mb-3">Get user presence</button>
      <p><b>User present on: </b> {{ state.presence?.join(", ") }}</p>
      <label for="check-channel" class="mt-3">Check presence on channel</label>
      <div class="flex">
        <input v-model="forms.presence.checkChannel" type="text" name="check-channel" />
        <button class="ml-2 flex-none" @click="handleCheckPresence">Check presence</button>
      </div>
    </section>
  </div>
</template>

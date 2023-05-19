<script>
  import { userIdAtom, authTokenAtom, chatAtom } from "../store"
  import { Chat } from "@pubnub/chat"

  function handleLogout() {
    userIdAtom.set()
    authTokenAtom.set()
  }

  $: (async () => {
    if (!$userIdAtom) window.location = "/"
    else {
      const chat = await Chat.init({
        subscribeKey: import.meta.env.PUBLIC_SUB_KEY || "",
        publishKey: import.meta.env.PUBLIC_PUB_KEY || "",
        userId: $userIdAtom,
      })
      chat.sdk.setToken($authTokenAtom)
      chatAtom.set(chat)
    }
  })()
</script>

<button type="button" class="float-right" on:click={handleLogout}>Log out</button>

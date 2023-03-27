<script>
  import { userIdAtom, authTokenAtom, chatAtom } from "../store"

  let currentUser = { name: "" }

  $: (async () => {
    if (!$chatAtom || !$userIdAtom) return
    currentUser = await $chatAtom.getUser($userIdAtom)
  })()
</script>

<p><b>Login form User ID:</b> {$userIdAtom}</p>
<p><b>JavaScript SDK User ID:</b> {$chatAtom?.sdk?.getUUID()}</p>
<p><b>Fetched User name:</b> {currentUser.name}</p>
<p class="break-all"><b>Auth token:</b> {$authTokenAtom}</p>

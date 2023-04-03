<script>
  import { userIdAtom, authTokenAtom } from "../store"

  let login, error

  async function handleSubmit() {
    if (!login) return
    const response = await fetch("api/login", {
      method: "post",
      body: JSON.stringify({ login }),
    })
    const json = await response.json()

    if (response.ok) {
      error = null
      const { token, userId } = json
      userIdAtom.set(userId)
      authTokenAtom.set(token)
      window.location = "/chat"
    } else {
      error = json.error
    }
  }

  $: if ($userIdAtom) window.location = "/chat"
</script>

{#if error}
  <p class="error mb-2">{error}</p>
{/if}
<form on:submit|preventDefault={handleSubmit}>
  <label for="login">User ID</label>
  <input bind:value={login} type="text" name="login" />
  <button type="submit" class="mt-4">Log in</button>
</form>

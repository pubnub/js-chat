<script>
  import { userIdAtom, authTokenAtom } from "../store"

  let login, name, profileUrl, error

  async function handleSubmit() {
    if (!login || !name) return
    const response = await fetch("api/register", {
      method: "post",
      body: JSON.stringify({ login, name, profileUrl }),
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
  <label for="name">Name</label>
  <input bind:value={name} type="text" name="name" />
  <label for="profileUrl">Avatar URL</label>
  <input bind:value={profileUrl} type="text" name="profileUrl" />
  <button type="submit" class="mt-4">Register</button>
</form>

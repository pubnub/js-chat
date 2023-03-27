<script>
  import { userIdAtom, authTokenAtom } from "../store"

  let login, error

  async function handleSubmit(e) {
    e.preventDefault()
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
<form on:submit={handleSubmit}>
  <label for="login" class="text-md font-bold">User ID</label><br />
  <input
    bind:value={login}
    type="text"
    name="login"
    class="border-2 rounded border-gray-400 hover:border-accent focus:border-accent outline-none transition mt-2 px-4 py-2 w-full"
  />
  <button type="submit" class="mt-2">Log in</button>
</form>

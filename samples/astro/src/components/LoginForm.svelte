<script>
  import ErrorNotice from "./ErrorNotice.svelte"

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
      console.log("Received data: ", json)
      error = null
      // window.location = "/chat"
    } else {
      error = json.error
    }
  }
</script>

{#if error}
  <ErrorNotice content={error} />
{/if}
<form on:submit={handleSubmit}>
  <label for="login" class="text-md font-bold">User ID</label><br />
  <input
    bind:value={login}
    type="text"
    name="login"
    class="border rounded border-gray-400 hover:border-accent focus:border-accent outline-none mt-2 px-4 py-2 w-full"
  />
  <button
    type="submit"
    class="border rounded border-gray-400 hover:border-accent focus:border-accent outline-none mt-2 px-4 py-2"
    >Log in</button
  >
</form>

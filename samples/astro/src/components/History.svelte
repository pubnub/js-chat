<script>
  import { chatAtom } from "../store"

  $: messages = []
  $: text = "Hello"

  async function getHistory() {
    const channel = await $chatAtom.getChannel("test-channel")
    const data = await channel?.getHistory()
    messages = data.messages
  }

  async function handleUpdate(message) {
    text = "Updated Hello"
    await message.editText("lorem ipsum 4")
    messages = [...messages]
    console.log("edited message: ", message)
  }

  $: if ($chatAtom) getHistory()
</script>

<div class="grid lg:grid-cols-2 gap-8 mt-6">
  <section>
    <h3>Channel history</h3>
    {text}
    {#each messages as message}
      <li>
        {message.userId}: {message.getText()}
        {message.hasUserReaction("👍")} <button on:click={() => handleUpdate(message)}>Edit</button>
      </li>
    {/each}
  </section>
</div>

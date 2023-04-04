<script>
  import { chatAtom } from "../store"

  let input,
    channels = []

  async function handleSubscribe() {
    $chatAtom.sdk.subscribe({ channels: input.split(","), withPresence: true })
    channels = $chatAtom.sdk.getSubscribedChannels()
    input = null
  }
</script>

<div class="grid lg:grid-cols-2 gap-8 mt-6">
  <section>
    <label for="channelSubscribe">Subscribe to channel</label>
    <div class="flex mb-3">
      <input bind:value={input} type="text" name="channelSubscribe" />
      <button on:click={handleSubscribe} class="ml-2 flex-none">Subscribe</button>
    </div>
    <p><b>Subscribed to channels:</b></p>
    <ul>
      {#each channels as channel}
        <li>{channel}</li>
      {/each}
    </ul>
  </section>
</div>

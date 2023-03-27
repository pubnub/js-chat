<script>
  import { chatAtom as chat } from "../store"

  let allIds = []
  let total = 0

  $: (async () => {
    if (!$chat) return
    const response = await $chat.sdk.objects.getAllUUIDMetadata({ include: { totalCount: true } })
    total = response.totalCount
    allIds = response.data.map((u) => u.id)
  })()
</script>

<p>Total: {total}</p>
<p>IDs: {allIds.join(", ")}</p>

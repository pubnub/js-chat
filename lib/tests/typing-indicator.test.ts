import axios from "axios"

describe("Verify typing indicator", () => {
  test.skip("should verify if message sent", async () => {
    const requestBody = {
      id: 0,
      text: "beep",
    }

    const url =
      "https://ps.pndsn.com/signal/pub-c-333d1228-ae6e-4b42-a727-bc7e53441692/sub-c-1556d25f-e911-44e1-b98b-79b4d0430eef/0/test-react-channel-C1/0/%22typing_on%22"

    const startTime = Date.now()

    const response = await axios.post(url, requestBody)

    const elapsedTime = Date.now() - startTime

    expect(elapsedTime).toBeLessThan(400)
    expect(response.status).toBe(200)
    expect(response.data).toContain("Sent")
  })
})

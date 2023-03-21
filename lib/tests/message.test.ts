import axios from "axios";

describe("Send message test", () => {
  test("should verify if message sent", async () => {
    const requestBody = {
      id: "6da72b98-e211-4724-aad4-e0fb9f56608999f345ojkk",
      text: "what next?",
      contentType: "none",
      content: {},
      custom: {},
      createdAt: "2023-03-08T14:48:00.000Z",
    };

    const url =
      "https://ps.pndsn.com/publish/pub-c-333d1228-ae6e-4b42-a727-bc7e53441692/sub-c-1556d25f-e911-44e1-b98b-79b4d0430eef/0/test-react-channel-C1/myCallback?store=1&uuid=test-react-channel-C1.test-react-user-U1";

    const startTime = Date.now();

    const response = await axios.post(url, requestBody);

    const elapsedTime = Date.now() - startTime;

    expect(elapsedTime).toBeLessThan(400);
    expect(response.status).toBe(200);
    expect(response.data).toContain("Sent");
  });

  test("should verify if message stored", async () => {
    const url =
      "https://ps.pndsn.com/v2/history/sub-key/sub-c-1556d25f-e911-44e1-b98b-79b4d0430eef/channel/test-react-channel-C1?count=1";

    const startTime = Date.now();

    const response = await axios.get(url);

    const elapsedTime = Date.now() - startTime;

    const message = response.data[0][0];

    expect(elapsedTime).toBeLessThan(400);
    expect(response.status).toBe(200);
    expect(message.contentType).toBe("none");
    expect(message.text).toBe("what next?");
    expect(message.id).toBe("6da72b98-e211-4724-aad4-e0fb9f56608999f345ojkk");
  });
});

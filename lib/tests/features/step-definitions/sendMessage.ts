import axios from "axios"
import { Given, When, Then } from "cucumber"

let requestBody: any
let response: any
let elapsedTime: number

Given("I have a message to send", () => {
  requestBody = {
    id: "6da72b98-e211-4724-aad4-e0fb9f56608999f345ojkk",
    text: "what next?",
    contentType: "none",
    content: {},
    custom: {},
    createdAt: "2023-03-08T14:48:00.000Z",
  };
});

When("I send the message", async () => {
  const url =
    "https://ps.pndsn.com/publish/pub-c-333d1228-ae6e-4b42-a727-bc7e53441692/sub-c-1556d25f-e911-44e1-b98b-79b4d0430eef/0/test-react-channel-C1/myCallback?store=1&uuid=test-react-channel-C1.test-react-user-U1";

  const startTime = Date.now();

  response = await axios.post(url, requestBody);

  elapsedTime = Date.now() - startTime;
});

Then("the message should be sent", () => {
  expect(elapsedTime).toBeLessThan(400);
  expect(response.status).toBe(200);
  expect(response.data).toContain("Sent");
});

//process.env.PUBLISH_KEY = "pub-c-92e62c76-408a-4ac4-aefc-a1d20a83b2a6";
//process.env.SUBSCRIBE_KEY = "sub-c-d0b8e542-12a0-41c4-999f-a2d569dc4255";
//process.env.USER_ID = "test-user";

module.exports = {
  bail: false,
  reporters: ["default", "jest-junit"],
  testTimeout: 10000,
  detectOpenHandles: true
}

module.exports = {
  bail: true,
  reporters: ["default", "jest-junit"],
  testTimeout: 10000,
  verbose: true,
  transformIgnorePatterns: [
    "<rootDir>/node_modules/(?!(pubnub)/)",
    // "<rootDir>/node_modules/(?!(pubnub/node_modules/node-fetch)/)",
  ],
}

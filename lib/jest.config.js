module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/features/**/*.feature"],
  testRunner: "jest-cucumber",
}

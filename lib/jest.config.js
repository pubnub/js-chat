module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFiles: ["./test-setup.js"],
  reporters: [
    "default",
    [
      "jest-junit",
      {
        outputDirectory: "./test-results/junit",
        outputName: "results.xml",
      },
    ],
  ],
}

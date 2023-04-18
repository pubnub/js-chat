module.exports = {
  bail: true,
  preset: "ts-jest",
  testEnvironment: "node",
  setupFiles: ["./test-setup.js"],
  reporters: [
    "default",
    [
      "jest-junit",
      {
        outputDirectory: "lib/test-results/junit",
        outputName: "results.xml",
      },
    ],
  ],
}

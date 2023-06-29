module.exports = {
  bail: true,
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

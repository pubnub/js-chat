module.exports = {
  bail: true,
  preset: "ts-jest",
  testEnvironment: "node",
  setupFiles: ["./test-setup.js"],
  reporters: [
    "default",
    [
      "@reportportal/agent-js-jest",
      {
        token: "b5acac03-2d5a-40f8-91c3-789e31c35a9e",
        endpoint: "http://localhost:8080/api/v1",
        project: "superadmin_personal",
        launch: "superadmin_TEST_EXAMPLE",
        description: "some Description",
        logLaunchLink: true,
        attributes: [
          {
            key: "YourKey",
            value: "YourValue",
          },
          {
            value: "YourValue",
          },
        ],
      },
      "jest-junit",
      {
        outputDirectory: "lib/test-results/junit",
        outputName: "results.xml",
      },
    ],
  ],
}

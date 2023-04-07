jest.mock("nanoid", () => ({
  nanoid: () => "this-is-a-fake-nano-id",
}))

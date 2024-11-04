// import { createChatInstance } from "./utils"
// import { Chat } from "@pubnub/chat_internal"
// import { jest } from "@jest/globals"
//
// const parseTokenReturnValue = {
//   resources: {
//     channels: {
//       "channel-a": {
//         read: true,
//         write: true,
//         manage: false,
//         delete: false,
//         get: true,
//         update: false,
//         join: true,
//       },
//       "channel-b": {
//         read: true,
//         write: false,
//         manage: false,
//         delete: false,
//         get: true,
//         update: false,
//         join: true,
//       },
//     },
//     uuids: {
//       some_uuid: {
//         read: true,
//         write: true,
//         manage: true,
//         delete: true,
//         get: true,
//         update: true,
//         join: true,
//       },
//       random_uuid: {
//         read: true,
//         write: false,
//         manage: false,
//         delete: false,
//         get: false,
//         update: false,
//         join: false,
//       },
//     },
//   },
//   patterns: {
//     channels: {
//       "^(?:group-room-){1}(?:.*)$": {
//         read: true,
//         write: true,
//         manage: false,
//         delete: false,
//         get: true,
//         update: true,
//         join: true,
//       },
//       "^(?:public-room-){1}(?:.*)$": {
//         read: true,
//         write: false,
//         manage: false,
//         delete: false,
//         get: false,
//         update: false,
//         join: true,
//       },
//       "^(?:unknown-room-){1}(?:.*)$": {
//         read: true,
//         write: false,
//         manage: false,
//         delete: false,
//         get: true,
//         update: false,
//         join: false,
//       },
//     },
//   },
// }
//
// describe("Pubnub Access Manager", () => {
//   let chat: Chat
//
//   test("should acknowledge proper access on 'channels' based on resources", async () => {
//     chat = await createChatInstance({
//       config: {
//         authKey: "abc",
//       },
//     })
//
//     const parseTokenSpy = jest.spyOn(chat.sdk, "parseToken").mockImplementation(() => {
//       return parseTokenReturnValue
//     })
//
//     const channelAPermissions = parseTokenReturnValue.resources.channels["channel-a"]
//     for (const key of Object.keys(channelAPermissions)) {
//       expect(
//         chat.accessManager.canI({
//           resourceName: "channel-a",
//           resourceType: "channels",
//           permission: key,
//         })
//       ).toBe(channelAPermissions[key])
//     }
//     const channelBPermissions = parseTokenReturnValue.resources.channels["channel-b"]
//     for (const key of Object.keys(channelBPermissions)) {
//       expect(
//         chat.accessManager.canI({
//           resourceName: "channel-b",
//           resourceType: "channels",
//           permission: key,
//         })
//       ).toBe(channelBPermissions[key])
//     }
//     const someUuidPermissions = parseTokenReturnValue.resources.uuids["some_uuid"]
//     for (const key of Object.keys(someUuidPermissions)) {
//       expect(
//         chat.accessManager.canI({
//           resourceName: "some_uuid",
//           resourceType: "uuids",
//           permission: key,
//         })
//       ).toBe(someUuidPermissions[key])
//     }
//     const randomUuidPermissions = parseTokenReturnValue.resources.uuids["random_uuid"]
//     for (const key of Object.keys(randomUuidPermissions)) {
//       expect(
//         chat.accessManager.canI({
//           resourceName: "random_uuid",
//           resourceType: "uuids",
//           permission: key,
//         })
//       ).toBe(randomUuidPermissions[key])
//     }
//
//     expect(
//       chat.accessManager.canI({
//         resourceName: "channel-c",
//         resourceType: "channels",
//         permission: "write",
//       })
//     ).toBe(false)
//     expect(
//       chat.accessManager.canI({
//         resourceName: "channel-v",
//         resourceType: "channels",
//         permission: "join",
//       })
//     ).toBe(false)
//
//     parseTokenSpy.mockRestore()
//   })
//
//   test("should acknowledge proper access on 'channels' based on patterns", async () => {
//     chat = await createChatInstance({
//       config: {
//         authKey: "hello",
//       },
//     })
//
//     const parseTokenSpy = jest.spyOn(chat.sdk, "parseToken").mockImplementation(() => {
//       return parseTokenReturnValue
//     })
//
//     const groupRoomsPermissions =
//       parseTokenReturnValue.patterns.channels["^(?:group-room-){1}(?:.*)$"]
//     for (const key of Object.keys(groupRoomsPermissions)) {
//       expect(
//         chat.accessManager.canI({
//           resourceName: "group-room-hello",
//           resourceType: "channels",
//           permission: key,
//         })
//       ).toBe(groupRoomsPermissions[key])
//     }
//     const publicRoomsPermissions =
//       parseTokenReturnValue.patterns.channels["^(?:public-room-){1}(?:.*)$"]
//     for (const key of Object.keys(publicRoomsPermissions)) {
//       expect(
//         chat.accessManager.canI({
//           resourceName: "public-room-pubnub",
//           resourceType: "channels",
//           permission: key,
//         })
//       ).toBe(publicRoomsPermissions[key])
//     }
//     const unknownRoomsPermissions =
//       parseTokenReturnValue.patterns.channels["^(?:unknown-room-){1}(?:.*)$"]
//     for (const key of Object.keys(unknownRoomsPermissions)) {
//       expect(
//         chat.accessManager.canI({
//           resourceName: "unknown-room-pubnub",
//           resourceType: "channels",
//           permission: key,
//         })
//       ).toBe(unknownRoomsPermissions[key])
//     }
//     expect(
//       chat.accessManager.canI({
//         resourceName: "some_jibberish",
//         resourceType: "channels",
//         permission: "manage",
//       })
//     ).toBe(false)
//
//     parseTokenSpy.mockRestore()
//   })
//
//   test("should return false for every resource and pattern which is not found", async () => {
//     chat = await createChatInstance({
//       config: {
//         authKey: "hello-world",
//       },
//     })
//
//     const parseTokenSpy = jest.spyOn(chat.sdk, "parseToken").mockImplementation(() => {
//       return parseTokenReturnValue
//     })
//
//     expect(
//       chat.accessManager.canI({
//         resourceName: "some-channel",
//         resourceType: "channels",
//         permission: "join",
//       })
//     ).toBe(false)
//     expect(
//       chat.accessManager.canI({
//         resourceName: "some-kind-of-uuid",
//         resourceType: "uuids",
//         permission: "update",
//       })
//     ).toBe(false)
//
//     parseTokenSpy.mockRestore()
//   })
//
//   test("should return true when auth key is not defined", async () => {
//     chat = await createChatInstance({ shouldCreateNewInstance: true })
//
//     expect(
//       chat.accessManager.canI({
//         resourceName: "some-channel",
//         resourceType: "channels",
//         permission: "join",
//       })
//     ).toBe(true)
//     expect(
//       chat.accessManager.canI({
//         resourceName: "some-kind-of-uuid",
//         resourceType: "uuids",
//         permission: "update",
//       })
//     ).toBe(true)
//   })
//
//   test("should work if only 'resources' are provided", async () => {
//     chat = await createChatInstance({
//       config: {
//         authKey: "hello",
//       },
//     })
//
//     const parseTokenSpy = jest.spyOn(chat.sdk, "parseToken").mockImplementation(() => {
//       return {
//         resources: parseTokenReturnValue.resources,
//       }
//     })
//
//     expect(
//       chat.accessManager.canI({
//         resourceName: "some-channel",
//         resourceType: "channels",
//         permission: "join",
//       })
//     ).toBe(false)
//     expect(
//       chat.accessManager.canI({
//         resourceName: "channel-b",
//         resourceType: "channels",
//         permission: "get",
//       })
//     ).toBe(true)
//
//     parseTokenSpy.mockRestore()
//   })
//
//   test("should work if only 'patterns' are provided", async () => {
//     chat = await createChatInstance({
//       config: {
//         authKey: "hello",
//       },
//     })
//
//     const parseTokenSpy = jest.spyOn(chat.sdk, "parseToken").mockImplementation(() => {
//       return {
//         patterns: parseTokenReturnValue.patterns,
//       }
//     })
//
//     expect(
//       chat.accessManager.canI({
//         resourceName: "public-room-hello",
//         resourceType: "channels",
//         permission: "update",
//       })
//     ).toBe(false)
//     expect(
//       chat.accessManager.canI({
//         resourceName: "pattern-not-found-room",
//         resourceType: "channels",
//         permission: "get",
//       })
//     ).toBe(false)
//
//     parseTokenSpy.mockRestore()
//   })
//
//   test("should throw an error when PAM does not grant 'write' access", async () => {
//     chat = await createChatInstance({
//       config: {
//         authKey: "hello",
//       },
//     })
//
//     const parseTokenSpy = jest.spyOn(chat.sdk, "parseToken").mockImplementation(() => {
//       return {
//         patterns: parseTokenReturnValue.patterns,
//       }
//     })
//     let thrownErrorMessage = ""
//     try {
//       await chat.signal({ channel: "forbidden-channel", message: { signaling: "forbidden" } })
//     } catch (e) {
//       thrownErrorMessage = e.message
//     }
//
//     expect(thrownErrorMessage).toBe(
//       'You tried to send a signal containing message: {"signaling":"forbidden"} to channel: forbidden-channel but PubNub Access Manager prevented you from doing so.'
//     )
//
//     parseTokenSpy.mockRestore()
//   })
// })

// import { TimetokenUtils } from "@pubnub/chat_internal"
//
// describe("Channel test", () => {
//   test("should convert unix timestamp to PubNub timetoken", () => {
//     const newDate = new Date().getTime()
//
//     expect(TimetokenUtils.unixToTimetoken(newDate)).toBe(newDate * 10000)
//     expect(TimetokenUtils.unixToTimetoken(10)).toBe(100000)
//     expect(TimetokenUtils.unixToTimetoken("1692689549407")).toBe(16926895494070000)
//   })
//
//   test("should throw an error if the passed value for unix timestamp is not a number", () => {
//     try {
//       TimetokenUtils.unixToTimetoken("I'm not a number")
//     } catch (e) {
//       expect(e).toBe("The value passed as unixTime is NaN")
//     }
//   })
//
//   test("should convert PubNub timetoken to unix timestamp", () => {
//     const newDate = new Date().getTime()
//
//     expect(TimetokenUtils.timetokenToUnix(newDate)).toBe(newDate / 10000)
//     expect(TimetokenUtils.timetokenToUnix(100000)).toBe(10)
//     expect(TimetokenUtils.timetokenToUnix("1692689549407")).toBe(169268954.9407)
//   })
//
//   test("should throw an error if the passed value for PN timetoken is not a number", () => {
//     try {
//       TimetokenUtils.timetokenToUnix("I'm not a number")
//     } catch (e) {
//       expect(e).toBe("The value passed as timetoken is NaN")
//     }
//   })
//
//   test("should convert PubNub timetoken to a Date object", () => {
//     expect(TimetokenUtils.timetokenToDate(169268954940700000)).toEqual(new Date(16926895494070))
//     expect(TimetokenUtils.timetokenToDate("16926895494000000")).toEqual(new Date(1692689549400))
//   })
//
//   test("should throw an error if the passed value for PN timetoken is not a number", () => {
//     try {
//       TimetokenUtils.timetokenToDate("{}")
//     } catch (e) {
//       expect(e).toBe("The value passed as timetoken is NaN")
//     }
//   })
//
//   test("should convert a Date object to PubNub timetoken", () => {
//     expect(TimetokenUtils.dateToTimetoken(new Date(1692689549407))).toBe(16926895494070000)
//     expect(TimetokenUtils.dateToTimetoken(new Date(169268954940))).toBe(1692689549400000)
//   })
//
//   test("should throw an error if the passed value for Date is not a Date", () => {
//     try {
//       // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//       // @ts-ignore
//       TimetokenUtils.dateToTimetoken("Whatever here")
//     } catch (e) {
//       expect(e).toBe("The value passed as date is not an instance of Date")
//     }
//   })
// })

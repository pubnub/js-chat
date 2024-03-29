export class TimetokenUtils {
  static unixToTimetoken(unixTime: string | number) {
    const unixTimeNumber = Number(unixTime)

    if (Number.isNaN(unixTimeNumber)) {
      throw "The value passed as unixTime is NaN"
    }

    return unixTimeNumber * 10000
  }

  static timetokenToUnix(timetoken: string | number) {
    const timetokenNumber = Number(timetoken)

    if (Number.isNaN(timetokenNumber)) {
      throw "The value passed as timetoken is NaN"
    }

    return timetokenNumber / 10000
  }

  static timetokenToDate(timetoken: string | number) {
    return new Date(this.timetokenToUnix(timetoken))
  }

  static dateToTimetoken(date: Date) {
    if (!(date instanceof Date)) {
      throw "The value passed as date is not an instance of Date"
    }

    return this.unixToTimetoken(date.getTime())
  }
}

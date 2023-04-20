export function unixToTimetoken(unixTime: string | number) {
  const unixTimeNumber = Number(unixTime)

  if (Number.isNaN(unixTimeNumber)) {
    throw "The value passed as unixTime is NaN"
  }

  return unixTimeNumber * 10000
}

export function timetokenToUnix(timetoken: string | number) {
  const timetokenNumber = Number(timetoken)

  if (Number.isNaN(timetokenNumber)) {
    throw "The value passed as timetoken is NaN"
  }

  return timetokenNumber / 10000
}

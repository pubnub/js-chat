const byteToHex: string[] = []

for (let i = 0; i < 256; i++) {
  byteToHex[i] = (i + 0x100).toString(16).substr(1)
}

const unparse = (buf: Array<number>, offset?: number) => {
  let i = offset || 0
  const bth = byteToHex

  return (
    bth[buf[i++]] +
    bth[buf[i++]] +
    bth[buf[i++]] +
    bth[buf[i++]] +
    "-" +
    bth[buf[i++]] +
    bth[buf[i++]] +
    "-" +
    bth[buf[i++]] +
    bth[buf[i++]] +
    "-" +
    bth[buf[i++]] +
    bth[buf[i++]] +
    "-" +
    bth[buf[i++]] +
    bth[buf[i++]] +
    bth[buf[i++]] +
    bth[buf[i++]] +
    bth[buf[i++]] +
    bth[buf[i++]]
  )
}

const min = 0
const max = 256
const RANDOM_LENGTH = 16

export const rng = () => {
  const result = new Array<number>(RANDOM_LENGTH)

  for (let j = 0; j < RANDOM_LENGTH; j++) {
    result[j] = 0xff & (Math.random() * (max - min) + min)
  }

  return result
}

export const uuidv4 = () => {
  const rnds: number[] = rng()

  rnds[6] = (rnds[6] & 0x0f) | 0x40
  rnds[8] = (rnds[8] & 0x3f) | 0x80

  return unparse(rnds)
}

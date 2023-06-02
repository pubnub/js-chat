export function getPhraseToLookFor(text: string) {
  const lastAtIndex = text.lastIndexOf("@")
  const charactersAfterAt = text.split("@").slice(-1)[0]

  if (lastAtIndex === -1 || charactersAfterAt.length < 3) {
    return null
  }

  const splitWords = charactersAfterAt.split(" ")

  if (splitWords.length > 2) {
    return null
  }

  return splitWords[0] + (splitWords[1] ? ` ${splitWords[1]}` : "")
}

export function extractErrorMessage(e: any) {
  if (typeof e === "string") return e
  let ret = ""
  const status = e?.status?.errorData?.status
  const message =
    e?.status?.errorData?.message || e?.status?.errorData?.error?.message || "Unknown error"
  if (status) ret += `${status}: `
  ret += message
  return ret
}

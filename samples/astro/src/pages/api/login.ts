import { chat, getGrantParams, headers } from "./helpers"

export async function post({ request }) {
  try {
    const body = await request.json()
    const { login } = body
    if (!login) throw "Missing parameters"
    const user = await chat.getUser(login)
    if (!user) throw "User not found"
    const grantParams = getGrantParams(login)
    const token = await chat.sdk.grantToken(grantParams)
    if (!token) throw "Error granting auth token"
    return new Response(JSON.stringify({ token, userId: login }), { status: 200, headers })
  } catch (error) {
    const message = error.status ? error.status.errorData.error.message : error
    return new Response(JSON.stringify({ error: message }), { status: 400, headers })
  }
}

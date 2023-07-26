import { chat, getGrantParams, headers } from "./helpers"

export async function post({ request }) {
  try {
    const body = await request.json()
    const { login, name, profileUrl } = body
    if (!login || !name) throw "Missing parameters"
    const newUser = await chat.createUser(login, { name, profileUrl })
    if (!newUser) throw "Creating user failed"
    let token = ""
    if (chat.sdk._config.secretKey) {
      const grantParams = getGrantParams(login)
      token = await chat.sdk.grantToken(grantParams)
      if (!token) throw "Error granting auth token"
    }
    return new Response(JSON.stringify({ token, userId: login }), { status: 200, headers })
  } catch (error) {
    const message = error.status ? error.status.errorData.error.message : error
    return new Response(JSON.stringify({ error: message }), { status: 400, headers })
  }
}
